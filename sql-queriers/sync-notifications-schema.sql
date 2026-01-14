-- =====================================================
-- SYNC NOTIFICATIONS TABLE SCHEMA
-- This script ensures the notifications table exists
-- and has the correct structure across all projects
-- =====================================================

-- Check if table exists, if not create it
DO $$
BEGIN
    -- Check if notifications table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        -- Create the notifications table
        CREATE TABLE notifications (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            priority VARCHAR(20) DEFAULT 'normal',
            viewed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE NULL,
            metadata JSONB DEFAULT '{}',
            action_url VARCHAR(500) NULL,
            action_text VARCHAR(100) NULL
        );

        -- Create indexes for better performance
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_viewed ON notifications(viewed);
        CREATE INDEX idx_notifications_created_at ON notifications(created_at);
        CREATE INDEX idx_notifications_type ON notifications(type);
        CREATE INDEX idx_notifications_priority ON notifications(priority);
        CREATE INDEX idx_notifications_user_viewed_created ON notifications(user_id, viewed, created_at DESC);

        RAISE NOTICE 'Created notifications table';
    ELSE
        RAISE NOTICE 'Notifications table already exists';
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add metadata column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column';
    END IF;

    -- Add action_url column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
        ALTER TABLE notifications ADD COLUMN action_url VARCHAR(500) NULL;
        RAISE NOTICE 'Added action_url column';
    END IF;

    -- Add action_text column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'action_text') THEN
        ALTER TABLE notifications ADD COLUMN action_text VARCHAR(100) NULL;
        RAISE NOTICE 'Added action_text column';
    END IF;

    -- Add expires_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'expires_at') THEN
        ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL;
        RAISE NOTICE 'Added expires_at column';
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON notifications;

-- Create RLS policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Staff')
        )
    );

CREATE POLICY "Admins can delete notifications" ON notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('Admin', 'Staff')
        )
    );

-- Create or replace helper functions
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

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

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '✅ Notifications schema sync completed successfully!';
END $$;
