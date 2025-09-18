-- Create a function to automatically sync company_name from profiles to projects
-- This will be triggered whenever a profile's company_name is updated

CREATE OR REPLACE FUNCTION sync_company_name_to_projects()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if company_name actually changed
  IF OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    -- Update all projects where author_id matches the updated profile
    UPDATE projects 
    SET company_name = NEW.company_name
    WHERE author_id = NEW.id;
    
    -- Log the update (optional - you can remove this if you don't want logging)
    RAISE NOTICE 'Updated company_name for % projects belonging to user %', 
      (SELECT COUNT(*) FROM projects WHERE author_id = NEW.id), 
      NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after a profile is updated
CREATE OR REPLACE TRIGGER trigger_sync_company_name
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_company_name_to_projects();

-- Optional: Also create a trigger for when new projects are created
-- This ensures new projects get the correct company_name from the start
CREATE OR REPLACE FUNCTION set_company_name_on_project_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set company_name from the author's profile when creating a new project
  IF NEW.company_name IS NULL THEN
    SELECT company_name INTO NEW.company_name
    FROM profiles 
    WHERE id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for new project creation
CREATE OR REPLACE TRIGGER trigger_set_company_name_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_company_name_on_project_insert();

-- Test the trigger (optional - you can run this to verify it works)
-- UPDATE profiles SET company_name = 'Test Company Updated' WHERE id = 'some-user-id';
-- Check if projects were updated: SELECT id, title, company_name FROM projects WHERE author_id = 'some-user-id';
