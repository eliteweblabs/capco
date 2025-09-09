-- Add image_paths column to discussion table for image uploads
-- Run this in your Supabase SQL Editor

-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'discussion' 
        AND column_name = 'image_paths'
    ) THEN
        -- Add the column as JSONB to store array of image paths
        ALTER TABLE discussion ADD COLUMN image_paths JSONB DEFAULT '[]'::jsonb;
        
        -- Add comment
        COMMENT ON COLUMN discussion.image_paths IS 'Array of image file paths attached to this discussion comment';
        
        RAISE NOTICE 'Added image_paths column to discussion table';
    ELSE
        RAISE NOTICE 'image_paths column already exists in discussion table';
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
AND column_name = 'image_paths';
