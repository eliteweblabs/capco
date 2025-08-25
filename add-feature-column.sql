-- Add 'feature' column to projects table
-- This column determines if a completed project should be featured on the public projects page

-- Add the feature column (defaults to false)
ALTER TABLE projects 
ADD COLUMN feature BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN projects.feature IS 'Marks completed projects as featured for public showcase';

-- Create an index for efficient filtering of featured projects
CREATE INDEX idx_projects_feature_status ON projects(feature, status) WHERE feature = true AND status = 220;

-- Optional: Update some existing completed projects to be featured (example data)
-- Uncomment and modify these as needed:

-- UPDATE projects 
-- SET feature = true 
-- WHERE status = 220 
-- AND id IN (
--   -- Replace these with actual project IDs you want to feature
--   1, 2, 3
-- );

-- Optional: Set a few sample projects as featured if they exist
-- This is just an example - adjust the WHERE clause as needed
UPDATE projects 
SET feature = true 
WHERE status = 220 
  AND address IS NOT NULL 
  AND sq_ft > 0
LIMIT 6;

-- Show the structure of the updated table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
