-- Add reply support to discussion table
-- Run this in your Supabase SQL Editor

-- Add parent_id column for replies
ALTER TABLE discussion ADD COLUMN parent_id INTEGER REFERENCES discussion(id);

-- Add comment to document the new column
COMMENT ON COLUMN discussion.parent_id IS 'References the parent comment this is replying to. NULL = top-level comment.';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'discussion' 
AND column_name = 'parent_id';
