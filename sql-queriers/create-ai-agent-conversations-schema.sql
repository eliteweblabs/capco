-- =====================================================
-- AI Agent Conversations & Usage Tracking Schema
-- =====================================================
-- This migration adds conversation history and usage tracking
-- for the AI agent platform
-- 
-- Run this in Supabase SQL Editor
-- =====================================================

-- Conversations table
-- Stores chat sessions/conversations with the AI agent
CREATE TABLE IF NOT EXISTS ai_agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, -- Auto-generated or user-provided title
  "projectId" INTEGER REFERENCES projects(id) ON DELETE SET NULL, -- Optional: link to project
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation messages table
-- Stores individual messages in conversations
CREATE TABLE IF NOT EXISTS ai_agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "conversationId" UUID REFERENCES ai_agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- Store actions, tokens, model, etc.
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Agent usage tracking table
-- Tracks API usage for billing/monitoring
CREATE TABLE IF NOT EXISTS ai_agent_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "conversationId" UUID REFERENCES ai_agent_conversations(id) ON DELETE SET NULL,
  "messageId" UUID REFERENCES ai_agent_messages(id) ON DELETE SET NULL,
  model TEXT NOT NULL, -- 'claude-3-5-sonnet-20241022', etc.
  "inputTokens" INTEGER NOT NULL,
  "outputTokens" INTEGER NOT NULL,
  "totalTokens" INTEGER NOT NULL,
  "estimatedCost" DECIMAL(10, 6), -- Estimated cost in USD
  "requestType" TEXT, -- 'chat', 'document_generation', 'analysis', etc.
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional tracking data
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON ai_agent_conversations("userId");
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON ai_agent_conversations("projectId");
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON ai_agent_conversations("createdAt");
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON ai_agent_messages("conversationId");
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai_agent_messages("createdAt");
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ai_agent_usage("userId");
CREATE INDEX IF NOT EXISTS idx_usage_conversation_id ON ai_agent_usage("conversationId");
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON ai_agent_usage("createdAt");
CREATE INDEX IF NOT EXISTS idx_usage_request_type ON ai_agent_usage("requestType");

-- Row Level Security (RLS) Policies
ALTER TABLE ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_usage ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can view/manage their own conversations, Admins can view all
CREATE POLICY "Users can view own conversations"
  ON ai_agent_conversations
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Users can create own conversations"
  ON ai_agent_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON ai_agent_conversations
  FOR UPDATE
  TO authenticated
  USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "Users can delete own conversations"
  ON ai_agent_conversations
  FOR DELETE
  TO authenticated
  USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Messages: Users can view messages for conversations they can access
CREATE POLICY "Users can view own conversation messages"
  ON ai_agent_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_agent_conversations
      WHERE ai_agent_conversations.id = ai_agent_messages."conversationId"
      AND (
        ai_agent_conversations."userId" = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'Admin'
        )
      )
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON ai_agent_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_agent_conversations
      WHERE ai_agent_conversations.id = ai_agent_messages."conversationId"
      AND ai_agent_conversations."userId" = auth.uid()
    )
  );

-- Usage: Users can view their own usage, Admins can view all
CREATE POLICY "Users can view own usage"
  ON ai_agent_usage
  FOR SELECT
  TO authenticated
  USING (
    "userId" = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

CREATE POLICY "System can create usage records"
  ON ai_agent_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow authenticated users to create usage records

-- Updated_at trigger function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_conversations_updated_at ON ai_agent_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON ai_agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate estimated cost based on model and tokens
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
) RETURNS DECIMAL(10, 6) AS $$
DECLARE
  input_cost_per_1k DECIMAL(10, 6);
  output_cost_per_1k DECIMAL(10, 6);
BEGIN
  -- Claude 3.5 Sonnet pricing (as of 2024)
  -- Input: $3.00 per 1M tokens, Output: $15.00 per 1M tokens
  IF p_model LIKE 'claude-3-5-sonnet%' THEN
    input_cost_per_1k := 0.003;
    output_cost_per_1k := 0.015;
  -- Claude 3 Opus pricing
  ELSIF p_model LIKE 'claude-3-opus%' THEN
    input_cost_per_1k := 0.015;
    output_cost_per_1k := 0.075;
  -- Claude 3 Haiku pricing
  ELSIF p_model LIKE 'claude-3-haiku%' THEN
    input_cost_per_1k := 0.00025;
    output_cost_per_1k := 0.00125;
  ELSE
    -- Default to Sonnet pricing
    input_cost_per_1k := 0.003;
    output_cost_per_1k := 0.015;
  END IF;
  
  RETURN (p_input_tokens::DECIMAL / 1000.0 * input_cost_per_1k) + 
         (p_output_tokens::DECIMAL / 1000.0 * output_cost_per_1k);
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ai_agent_conversations TO authenticated;
GRANT ALL ON ai_agent_messages TO authenticated;
GRANT ALL ON ai_agent_usage TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================
-- Tables created:
--   - ai_agent_conversations (chat sessions)
--   - ai_agent_messages (individual messages)
--   - ai_agent_usage (usage tracking for billing)
--
-- RLS policies configured for:
--   - Users can access their own conversations
--   - Admins can access all conversations
--   - Usage tracking for billing/monitoring
--
-- Cost calculation function included for billing
-- =====================================================

