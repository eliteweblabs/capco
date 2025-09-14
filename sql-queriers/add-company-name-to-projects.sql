-- Add company_name column to projects table
-- This will store the company name directly on the project to avoid joins

ALTER TABLE projects 
ADD COLUMN company_name TEXT;

-- Update existing projects with company names from profiles
UPDATE projects 
SET company_name = profiles.company_name
FROM profiles 
WHERE projects.author_id = profiles.id;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_company_name ON projects(company_name);

-- Add comment to document the column
COMMENT ON COLUMN projects.company_name IS 'Company name from the project author - denormalized for performance';
