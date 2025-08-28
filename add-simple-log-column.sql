-- Simple Logging Solution: Add a 'log' JSON column to projects table
-- This is much simpler than the complex logging system

-- Add the log column to projects table
ALTER TABLE projects 
ADD COLUMN log JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN projects.log IS 'Simple JSON log of project changes and activities';

-- Create an index for efficient querying of log data
CREATE INDEX idx_projects_log ON projects USING GIN (log);

-- Show the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'log'
ORDER BY ordinal_position;

-- Example of how the log will work:
-- Each log entry will be a JSON object like:
-- {
--   "timestamp": "2024-01-15T10:30:00Z",
--   "action": "status_change",
--   "user": "john@example.com",
--   "details": "Changed status from 10 to 20",
--   "old_value": 10,
--   "new_value": 20
-- }

SELECT 'Simple log column added successfully!' as status;
