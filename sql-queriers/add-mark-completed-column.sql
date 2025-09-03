-- Add mark_completed column to discussion table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'discussion' 
        AND column_name = 'mark_completed'
    ) THEN
        -- Add the column
        ALTER TABLE discussion ADD COLUMN mark_completed BOOLEAN DEFAULT FALSE;
        
        -- Add comment
        COMMENT ON COLUMN discussion.mark_completed IS 'Whether this discussion item has been marked as completed';
        
        RAISE NOTICE 'Added mark_completed column to discussion table';
    ELSE
        RAISE NOTICE 'mark_completed column already exists in discussion table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'discussion' 
AND column_name = 'mark_completed';
