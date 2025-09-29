-- Fixed function to automatically assign default discussion to new projects
-- This trigger will fire when a new project is inserted into the database

-- First, create the function that will be called by the trigger
-- Use SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION assign_default_discussion_to_project()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_name TEXT;
BEGIN
  -- Get the global company name from profiles table (Admin user)
  SELECT company_name INTO company_name 
  FROM profiles 
  WHERE role = 'Admin' 
  LIMIT 1;
  
  -- Fallback to default if no admin found
  IF company_name IS NULL THEN
    company_name := 'CAPCO Design Group';
  END IF;

  -- Insert default discussion comments for the new project
  INSERT INTO discussion (
    project_id,
    author_id,
    message,
    internal,
    created_at,
    updated_at,
    mark_completed,
    company_name
  ) VALUES 
    -- Welcome message for the client
    (
      NEW.id,
      NEW.author_id, -- Use the project author instead of hardcoded ID
      'Welcome to your new project! We''re excited to work with you on ' || COALESCE(NEW.title, 'your project') || ' at ' || COALESCE(NEW.address, 'the specified location') || '. Our team will be in touch soon to discuss the next steps.',
      false, -- Client visible
      NOW(),
      NOW(),
      true,
      company_name
    ),
    -- Internal note for the team
    (
      NEW.id,
      NEW.author_id, -- Use the project author instead of hardcoded ID
      'New project created: ' || COALESCE(NEW.title, 'Untitled Project') || ' at ' || COALESCE(NEW.address, 'Unknown Address') || '. Please review project details and assign appropriate team members.',
      true, -- Internal only
      NOW(),
      NOW(),
      false,
      company_name
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after a new project is inserted
DROP TRIGGER IF EXISTS trigger_assign_default_discussion ON projects;

CREATE TRIGGER trigger_assign_default_discussion
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_discussion_to_project();

-- Add a comment to document the trigger
COMMENT ON TRIGGER trigger_assign_default_discussion ON projects IS 
'Automatically assigns default discussion comments to new projects when they are created';

-- Optional: Create a function to manually assign default discussion to existing projects
CREATE OR REPLACE FUNCTION assign_default_discussion_to_existing_project(project_id_param INTEGER)
RETURNS VOID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
  company_name TEXT;
BEGIN
  -- Get the project details
  SELECT * INTO project_record FROM projects WHERE id = project_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project with ID % not found', project_id_param;
  END IF;
  
  -- Check if discussions already exist for this project
  IF EXISTS (SELECT 1 FROM discussion WHERE project_id = project_id_param) THEN
    RAISE NOTICE 'Project % already has discussions. Skipping default assignment.', project_id_param;
    RETURN;
  END IF;
  
  -- Get the global company name from profiles table (Admin user)
  SELECT company_name INTO company_name 
  FROM profiles 
  WHERE role = 'Admin' 
  LIMIT 1;
  
  -- Fallback to default if no admin found
  IF company_name IS NULL THEN
    company_name := 'CAPCo Fire Protection Systems';
  END IF;
  
  -- Insert default discussions
  INSERT INTO discussion (
    project_id,
    author_id,
    message,
    internal,
    created_at,
    updated_at,
    mark_completed,
    company_name
  ) VALUES 
    (
      project_record.id,
      project_record.author_id, -- Use the project author instead of hardcoded ID
      'Welcome to your new project! We''re excited to work with you on ' || COALESCE(project_record.title, 'your project') || ' at ' || COALESCE(project_record.address, 'the specified location') || '. Our team will be in touch soon to discuss the next steps.',
      false,
      NOW(),
      NOW(),
      true,
      company_name
    ),
    (
      project_record.id,
      project_record.author_id,
      'New project created: ' || COALESCE(project_record.title, 'Untitled Project') || ' at ' || COALESCE(project_record.address, 'Unknown Address') || '. Please review project details and assign appropriate team members.',
      true,
      NOW(),
      NOW(),
      false,
      company_name
    ),
    (
      project_record.id,
      project_record.author_id,
      'Project Kickoff Checklist:
      ✓ Project created and documented
      ✓ Client notified
      ⏳ Site visit scheduled
      ⏳ Initial proposal prepared
      ⏳ Team assigned',
      true,
      NOW(),
      NOW(),
      false,
      company_name
    ),
    (
      project_record.id,
      project_record.author_id,
      'Next Steps for Client:
      1. We will schedule a site visit within 2-3 business days
      2. Our team will prepare a detailed proposal based on your requirements
      3. You will receive updates via email
      4. Feel free to reach out with any questions',
      false,
      NOW(),
      NOW(),
      false,
      company_name
    );
    
  RAISE NOTICE 'Default discussion assigned to project %', project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the manual function
COMMENT ON FUNCTION assign_default_discussion_to_existing_project(INTEGER) IS 
'Manually assigns default discussion comments to an existing project that was created before this trigger was implemented';

-- Example usage for existing projects:
-- SELECT assign_default_discussion_to_existing_project(123); -- Replace 123 with actual project ID
