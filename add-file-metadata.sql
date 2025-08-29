-- =====================================================
-- ADD FILE METADATA: Add title and comments to files table
-- Run this in Supabase SQL Editor to enable file metadata
-- =====================================================

-- Add title and comments columns to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add indexes for better performance on metadata searches
CREATE INDEX IF NOT EXISTS idx_files_title ON files(title);
CREATE INDEX IF NOT EXISTS idx_files_comments ON files USING gin(to_tsvector('english', comments));

-- Update existing files to have default titles (using file_name)
UPDATE files 
SET title = file_name 
WHERE title IS NULL;

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;

SELECT 'File metadata columns added successfully!' as status;
