-- Add log column to projects table for SimpleProjectLogger
-- This stores JSON array of log entries for project activity tracking

-- Add the log column as JSONB array
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS log JSONB DEFAULT '[]'::JSONB;

-- Add GIN index for efficient querying of JSONB log data
CREATE INDEX IF NOT EXISTS idx_projects_log 
ON projects USING GIN (log);

-- Add comment to document the column
COMMENT ON COLUMN projects.log IS 'JSON array of log entries for project activity tracking';

-- Create a function to safely append to log array
CREATE OR REPLACE FUNCTION append_to_project_log(
  project_id_param INTEGER,
  log_entry JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE projects 
  SET log = COALESCE(log, '[]'::JSONB) || log_entry
  WHERE id = project_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get recent log entries
CREATE OR REPLACE FUNCTION get_recent_project_logs(
  project_id_param INTEGER,
  limit_count INTEGER DEFAULT 50
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(
    (
      SELECT jsonb_agg(entry ORDER BY (entry->>'timestamp')::TIMESTAMPTZ DESC)
      FROM jsonb_array_elements(log) AS entry
      LIMIT limit_count
    ),
    '[]'::JSONB
  ) INTO result
  FROM projects 
  WHERE id = project_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
