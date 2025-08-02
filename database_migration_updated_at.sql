-- Database Migration: Add updated_at field to projects table
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add the updated_at column with default to current timestamp
ALTER TABLE projects 
ADD COLUMN updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();

-- Step 2: Update existing projects to have updated_at = created (if they have created field)
UPDATE projects 
SET updated_at = created 
WHERE created IS NOT NULL AND updated_at IS NULL;

-- Step 3: Create a trigger function to automatically update the updated_at field
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create the trigger for the projects table
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Verify the changes (optional)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'updated_at';

-- You should see something like:
-- table_name | column_name | data_type                   | is_nullable | column_default
-- projects   | updated_at  | timestamp without time zone | YES         | now()