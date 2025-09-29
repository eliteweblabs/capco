-- Create a function to automatically sync assigned_to_name from profiles to projects
-- This will be triggered whenever a profile's company_name is updated
-- Maps: profiles.company_name -> projects.assigned_to_name (where projects.assigned_to_id = profiles.id)

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

-- Create the trigger that fires after a profile is updated
CREATE OR REPLACE TRIGGER trigger_sync_assigned_to_name
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_assigned_to_name_to_projects();

-- Optional: Also create a trigger for when projects are assigned to someone
-- This ensures assigned_to_name is set when a project gets assigned
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

-- Create the trigger for project assignment updates
CREATE OR REPLACE TRIGGER trigger_set_assigned_to_name_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_assigned_to_name_on_project_update();

-- Optional: Also handle new project creation with assigned_to_id
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

-- Create the trigger for new project creation with assignment
CREATE OR REPLACE TRIGGER trigger_set_assigned_to_name_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_assigned_to_name_on_project_insert();

-- Test the triggers (optional - you can run this to verify they work)
-- UPDATE profiles SET company_name = 'New Staff Company' WHERE id = 'staff-user-id';
-- Check if assigned projects were updated: SELECT id, title, assigned_to_name FROM projects WHERE assigned_to_id = 'staff-user-id';
-- 
-- Test assignment: UPDATE projects SET assigned_to_id = 'staff-user-id' WHERE id = 'some-project-id';
-- Check if assigned_to_name was set: SELECT id, title, assigned_to_name FROM projects WHERE id = 'some-project-id';
