-- AI Agent Knowledge Base Schema
-- Allows manual addition of knowledge/facts to the AI agent's memory

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Knowledge base entries table
CREATE TABLE IF NOT EXISTS ai_agent_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- e.g., "company_policy", "nfpa_standards", "procedures", "facts"
  tags TEXT[], -- Array of tags for easier searching
  priority INTEGER DEFAULT 0, -- Higher priority entries shown first
  "isActive" BOOLEAN DEFAULT true,
  "authorId" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- Additional metadata
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_agent_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_active ON ai_agent_knowledge("isActive");
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_priority ON ai_agent_knowledge(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_tags ON ai_agent_knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_created ON ai_agent_knowledge("createdAt" DESC);

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_ai_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updatedAt
DROP TRIGGER IF EXISTS update_ai_knowledge_updated_at_trigger ON ai_agent_knowledge;
CREATE TRIGGER update_ai_knowledge_updated_at_trigger
  BEFORE UPDATE ON ai_agent_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_knowledge_updated_at();

-- RLS Policies
ALTER TABLE ai_agent_knowledge ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all knowledge"
  ON ai_agent_knowledge
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Users can view active knowledge
CREATE POLICY "Users can view active knowledge"
  ON ai_agent_knowledge
  FOR SELECT
  TO authenticated
  USING ("isActive" = true);

-- Users can create their own knowledge entries
CREATE POLICY "Users can create knowledge"
  ON ai_agent_knowledge
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "authorId");

-- Users can update their own knowledge entries
CREATE POLICY "Users can update own knowledge"
  ON ai_agent_knowledge
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = "authorId")
  WITH CHECK (auth.uid() = "authorId");

-- Users can delete their own knowledge entries
CREATE POLICY "Users can delete own knowledge"
  ON ai_agent_knowledge
  FOR DELETE
  TO authenticated
  USING (auth.uid() = "authorId");

-- Sample knowledge entries
INSERT INTO ai_agent_knowledge (title, content, category, tags, priority, "authorId")
VALUES
  (
    'Company Name',
    'CAPCO Design Group is a professional fire protection engineering firm specializing in plan review and approval.',
    'company_info',
    ARRAY['company', 'about'],
    10,
    NULL -- System entry
  ),
  (
    'NFPA 13 Sprinkler Systems',
    'NFPA 13 covers installation of sprinkler systems. Key requirements include proper spacing, water supply calculations, and regular inspections.',
    'nfpa_standards',
    ARRAY['nfpa13', 'sprinklers', 'standards'],
    5,
    NULL
  )
ON CONFLICT DO NOTHING;

-- Function to get knowledge for agent context
CREATE OR REPLACE FUNCTION get_agent_knowledge(
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.title,
    k.content,
    k.category,
    k.tags,
    k.priority
  FROM ai_agent_knowledge k
  WHERE k."isActive" = true
    AND (p_category IS NULL OR k.category = p_category)
  ORDER BY k.priority DESC, k."createdAt" DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

