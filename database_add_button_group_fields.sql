-- Database Migration: Add button group fields to projects table
-- This migration adds the fields needed for the button group selections

-- Step 1: Add the button group fields to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS building TEXT,
ADD COLUMN IF NOT EXISTS project TEXT,
ADD COLUMN IF NOT EXISTS service TEXT,
ADD COLUMN IF NOT EXISTS requested_docs TEXT;

-- Step 2: Add comments to document the fields
COMMENT ON COLUMN projects.building IS 'Building type selection (Residential, Mixed use, Mercantile, etc.)';
COMMENT ON COLUMN projects.project IS 'Project type selection (Sprinkler, Alarm, Mechanical, etc.)';
COMMENT ON COLUMN projects.service IS 'Service type selection (Pump & Tank, 2'' copper, etc.)';
COMMENT ON COLUMN projects.requested_docs IS 'Requested documents selection (Sprinkler, Alarm, NFPA 241, etc.)';

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_building ON projects(building);
CREATE INDEX IF NOT EXISTS idx_projects_project ON projects(project);
CREATE INDEX IF NOT EXISTS idx_projects_service ON projects(service);
CREATE INDEX IF NOT EXISTS idx_projects_requested_docs ON projects(requested_docs);

-- Step 4: Update RLS policies to include the new fields
-- The existing RLS policies should work with the new fields since they're based on author_id

-- Step 5: Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('building', 'project', 'service', 'requested_docs')
ORDER BY ordinal_position; 