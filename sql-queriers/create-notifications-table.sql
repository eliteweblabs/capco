-- =====================================================
-- CREATE INTERNAL NOTIFICATIONS TABLE
-- This table stores internal notifications for users
-- =====================================================

-- Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    metadata JSONB DEFAULT '{}',
    action_url VARCHAR(500) NULL,
    action_text VARCHAR(100) NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_viewed ON notifications(viewed);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Create composite index for user notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_viewed_created 
ON notifications(user_id, viewed, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Internal notifications system for users';
COMMENT ON COLUMN notifications.user_id IS 'User who receives the notification';
COMMENT ON COLUMN notifications.title IS 'Short title for the notification';
COMMENT ON COLUMN notifications.message IS 'Main notification message';
COMMENT ON COLUMN notifications.type IS 'Notification type: info, success, warning, error';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN notifications.viewed IS 'Whether the user has viewed this notification';
COMMENT ON COLUMN notifications.expires_at IS 'Optional expiration date for the notification';
COMMENT ON COLUMN notifications.metadata IS 'Additional data stored as JSON';
COMMENT ON COLUMN notifications.action_url IS 'Optional URL for action button';
COMMENT ON COLUMN notifications.action_text IS 'Text for action button';

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (for marking as viewed)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Staff')
        )
    );

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Staff')
        )
    );

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM notifications 
        WHERE user_id = user_uuid 
        AND viewed = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT INSERT, DELETE ON notifications TO authenticated;
