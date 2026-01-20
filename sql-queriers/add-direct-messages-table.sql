-- Direct Messages Table for Socket.io Direct Messaging
-- Stores 1-on-1 messages between users

-- Create directMessages table
CREATE TABLE IF NOT EXISTS directMessages (
  id SERIAL PRIMARY KEY,
  from_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  to_user UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_directMessages_from_user ON directMessages(from_user);
CREATE INDEX IF NOT EXISTS idx_directMessages_to_user ON directMessages(to_user);
CREATE INDEX IF NOT EXISTS idx_directMessages_timestamp ON directMessages(message_timestamp);
CREATE INDEX IF NOT EXISTS idx_directMessages_conversation ON directMessages(from_user, to_user);

-- Create composite index for conversation queries
CREATE INDEX IF NOT EXISTS idx_directMessages_conversation_timestamp 
ON directMessages(from_user, to_user, message_timestamp);

-- RLS Policies for directMessages
ALTER TABLE directMessages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "Users can view their direct messages" ON directMessages
  FOR SELECT USING (
    from_user = auth.uid() OR to_user = auth.uid()
  );

-- Users can insert messages they send
CREATE POLICY "Users can send direct messages" ON directMessages
  FOR INSERT WITH CHECK (
    from_user = auth.uid()
  );

-- Users can update their own messages (for read status, etc.)
CREATE POLICY "Users can update their direct messages" ON directMessages
  FOR UPDATE USING (
    from_user = auth.uid() OR to_user = auth.uid()
  );

-- Users can delete their own messages
CREATE POLICY "Users can delete their direct messages" ON directMessages
  FOR DELETE USING (
    from_user = auth.uid()
  );

-- Function to get conversation between two users
CREATE OR REPLACE FUNCTION get_conversation(user1_id UUID, user2_id UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id INTEGER,
  from_user UUID,
  from_name TEXT,
  to_user UUID,
  message TEXT,
  message_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.id,
    dm.from_user,
    dm.from_name,
    dm.to_user,
    dm.message,
    dm.message_timestamp,
    dm.created_at,
    dm.read_at
  FROM directMessages dm
  WHERE 
    dm.is_deleted = FALSE
    AND (
      (dm.from_user = user1_id AND dm.to_user = user2_id)
      OR (dm.from_user = user2_id AND dm.to_user = user1_id)
    )
  ORDER BY dm.message_timestamp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conversation_user_id UUID, current_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE directMessages 
  SET read_at = NOW()
  WHERE 
    from_user = conversation_user_id 
    AND to_user = current_user_id
    AND read_at IS NULL
    AND is_deleted = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM directMessages
  WHERE 
    to_user = user_id
    AND read_at IS NULL
    AND is_deleted = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get recent conversations for a user
CREATE OR REPLACE FUNCTION get_recent_conversations(user_id UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_summary AS (
    SELECT 
      CASE 
        WHEN dm.from_user = user_id THEN dm.to_user
        ELSE dm.from_user
      END as other_user_id,
      CASE 
        WHEN dm.from_user = user_id THEN 
          (SELECT company_name FROM profiles WHERE id = dm.to_user)
        ELSE dm.from_name
      END as other_user_name,
      dm.message as last_message,
      dm.message_timestamp as last_message_time,
      CASE 
        WHEN dm.to_user = user_id AND dm.read_at IS NULL THEN 1
        ELSE 0
      END as is_unread
    FROM directMessages dm
    WHERE 
      dm.is_deleted = FALSE
      AND (dm.from_user = user_id OR dm.to_user = user_id)
    ORDER BY dm.message_timestamp DESC
  ),
  grouped_conversations AS (
    SELECT 
      other_user_id,
      other_user_name,
      first_value(last_message) OVER (PARTITION BY other_user_id ORDER BY last_message_time DESC) as last_message,
      first_value(last_message_time) OVER (PARTITION BY other_user_id ORDER BY last_message_time DESC) as last_message_time,
      sum(is_unread) OVER (PARTITION BY other_user_id) as unread_count
    FROM conversation_summary
  )
  SELECT DISTINCT
    other_user_id,
    other_user_name,
    last_message,
    last_message_time,
    unread_count::INTEGER
  FROM grouped_conversations
  ORDER BY last_message_time DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_conversation(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_conversations(UUID, INTEGER) TO authenticated;

-- Insert some sample data (optional - remove in production)
-- INSERT INTO directMessages (from_user, from_name, to_user, message) VALUES
-- ('user1-uuid', 'User One', 'user2-uuid', 'Hello! How are you?'),
-- ('user2-uuid', 'User Two', 'user1-uuid', 'Hi! I am doing well, thanks!');
