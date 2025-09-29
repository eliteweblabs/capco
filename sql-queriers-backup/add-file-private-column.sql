-- Add private column to files table
-- This allows files to be hidden from clients

-- Add is_private column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add index for better performance on private queries
CREATE INDEX IF NOT EXISTS idx_files_is_private ON files(is_private);

-- Update existing files based on project status
-- Files uploaded when project status < 30 should be public (not private)
-- Files uploaded when project status >= 30 should be private by default
UPDATE files 
SET is_private = CASE 
  WHEN EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = files.project_id 
    AND p.status >= 30
  ) THEN true
  ELSE false
END
WHERE is_private IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN files.is_private IS 'Whether the file is private (hidden from clients)';
