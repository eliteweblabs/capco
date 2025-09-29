-- Remove company_name column from projects table
-- This eliminates the ambiguous column reference issue
-- company_name should always come from profiles table

-- Drop the company_name column from projects table
ALTER TABLE projects DROP COLUMN IF EXISTS company_name;

-- Note: After running this, all references to projects.company_name should be updated
-- to use profiles.company_name through proper JOINs
