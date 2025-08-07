-- Database Migration: Add units field to projects table
-- This migration adds the units field needed for the units slider

-- Step 1: Add the units field to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS units INTEGER DEFAULT 1;

-- Step 2: Add comment to document the field
COMMENT ON COLUMN projects.units IS 'Number of units for the project (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 40, 50)';

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_units ON projects(units);

-- Step 4: Update existing projects to have a default units value if they don't have one
UPDATE projects 
SET units = 1 
WHERE units IS NULL;

-- Step 5: Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'units'; 