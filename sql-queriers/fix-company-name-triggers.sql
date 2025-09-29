-- Fix all database triggers and functions that reference company_name in projects table
-- This should be run AFTER removing the company_name column from projects table

-- Drop any existing triggers that might be causing issues
DROP TRIGGER IF EXISTS trigger_set_assigned_to_name_on_insert ON projects;
DROP TRIGGER IF EXISTS trigger_set_assigned_to_name_on_update ON projects;
DROP TRIGGER IF EXISTS trigger_sync_assigned_to_name ON profiles;

-- Drop the functions that might be causing issues
DROP FUNCTION IF EXISTS set_assigned_to_name_on_project_insert();
DROP FUNCTION IF EXISTS set_assigned_to_name_on_project_update();
DROP FUNCTION IF EXISTS sync_assigned_to_name_to_projects();

-- Recreate the triggers with the correct logic (no company_name references to projects table)
CREATE OR REPLACE FUNCTION set_assigned_to_name_on_project_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set assigned_to_name and assigned_to_avatar from the assigned user's profile when creating a new project
  IF NEW.assigned_to_id IS NOT NULL THEN
    SELECT profiles.company_name, profiles.avatar_url INTO NEW.assigned_to_name, NEW.assigned_to_avatar
    FROM profiles 
    WHERE profiles.id = NEW.assigned_to_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_assigned_to_name_on_project_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set assigned_to_name from the assigned user's profile when assigned_to_id changes
  IF NEW.assigned_to_id IS DISTINCT FROM OLD.assigned_to_id THEN
    IF NEW.assigned_to_id IS NOT NULL THEN
      SELECT profiles.company_name, profiles.avatar_url INTO NEW.assigned_to_name, NEW.assigned_to_avatar
      FROM profiles 
      WHERE profiles.id = NEW.assigned_to_id;
    ELSE
      -- If assigned_to_id is set to NULL, clear assigned_to_name and assigned_to_avatar
      NEW.assigned_to_name = NULL;
      NEW.assigned_to_avatar = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_assigned_to_name_to_projects()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if company_name actually changed
  IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    -- Update all projects where assigned_to_id matches the updated profile
    UPDATE projects 
    SET assigned_to_name = NEW.company_name
    WHERE assigned_to_id = NEW.id;
    
    -- Log the update (optional - you can remove this if you don't want logging)
    RAISE NOTICE 'Updated assigned_to_name for % projects assigned to user %', 
      (SELECT COUNT(*) FROM projects WHERE assigned_to_id = NEW.id), 
      NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers
CREATE OR REPLACE TRIGGER trigger_set_assigned_to_name_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_assigned_to_name_on_project_insert();

CREATE OR REPLACE TRIGGER trigger_set_assigned_to_name_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_assigned_to_name_on_project_update();

CREATE OR REPLACE TRIGGER trigger_sync_assigned_to_name
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_assigned_to_name_to_projects();
