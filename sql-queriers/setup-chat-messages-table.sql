-- Create chatMessages table for persistent chat storage
CREATE TABLE IF NOT EXISTS chatMessages (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chatMessages_timestamp ON chatMessages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_chatMessages_user_id ON chatMessages(user_id);

-- Enable RLS
ALTER TABLE chatMessages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all messages
CREATE POLICY "Admins can view all chat messages" ON chatMessages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Users can see all messages (for chat history)
CREATE POLICY "Users can view all chat messages" ON chatMessages
  FOR SELECT USING (true);

-- Users can insert their own messages
CREATE POLICY "Users can insert their own messages" ON chatMessages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete any chat message" ON chatMessages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Grant permissions
GRANT ALL ON chatMessages TO authenticated;
GRANT USAGE ON SEQUENCE chatMessages_id_seq TO authenticated;
