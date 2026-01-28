-- Auto-update updatedAt column ONLY when status changes
-- This trigger ensures updatedAt reflects when the project status was last changed

-- First, create the function that updates the timestamp only on status change
CREATE OR REPLACE FUNCTION update_updated_at_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update updatedAt if status has changed
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        NEW."updatedAt" = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- Create the trigger that fires before any UPDATE on the projects table
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_on_status_change();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'projects'
    AND trigger_name = 'update_projects_updated_at';

-- Test the trigger (optional)
-- UPDATE projects SET status = status + 1 WHERE id = 1;  -- This WILL update updatedAt
-- UPDATE projects SET dueDate = NOW() WHERE id = 1;      -- This will NOT update updatedAt
