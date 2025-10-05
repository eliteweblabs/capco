-- Function to automatically assign default discussion to new projects
-- This trigger will fire when a new project is inserted into the database

-- First, create the function that will be called by the trigger
-- Use SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION assign_default_discussion_to_project()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default discussion comments for the new project
  INSERT INTO discussion (
    project_id,
    author_id,
    message,
    internal,
    created_at,
    updated_at,
    mark_completed
  ) VALUES 
    -- Welcome message for the client
    (
      NEW.id,
      NEW.author_id,
      'Welcome to your new project! We''re excited to work with you on {{PROJECT_TITLE}} at {{PROJECT_ADDRESS}}. Our team will be in touch soon to discuss the next steps.',
      true, -- Client visible
      NOW(),
      NOW(),
      true
    ),
    -- Internal note for the team
    (
      NEW.id,
      NEW.author_id,
      'New project created: {{PROJECT_TITLE}} at {{PROJECT_ADDRESS}}. Please review project details and assign appropriate team members.',
      true, -- Internal only
      NOW(),
      NOW(),
      true
    ),
    -- Project kickoff checklist
    (
      NEW.id,
      NEW.author_id,
      'Project Kickoff Checklist:
      ✓ Project created and documented
      ✓ Client notified
      ⏳ Site visit scheduled
      ⏳ Initial proposal prepared
      ⏳ Team assigned',
      true, -- Internal only
      NOW(),
      NOW(),
      false
    ),
    -- Client communication template
    (
      NEW.id,
      NEW.author_id,
      'Next Steps for {{COMPANY_NAME}}:
      1. We will schedule a site visit within 2-3 business days
      2. Our team will prepare a detailed proposal based on your requirements
      3. You will receive updates via email at {{CLIENT_EMAIL}}
      4. Feel free to reach out with any questions',
      false, -- Client visible
      NOW(),
      NOW(),
      false
    );

  -- Note: Logging removed since project_logs table doesn't exist
  -- You can add logging later if needed

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
  
  -- Insert default discussions
  INSERT INTO discussion (
    project_id,
    author_id,
    message,
    internal,
    created_at,
    updated_at,
    mark_completed
  ) VALUES 
    (
      project_record.id,
      'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
      'Welcome to your new project! We''re excited to work with you on ' || COALESCE(project_record.title, 'your project') || ' at ' || COALESCE(project_record.address, 'the specified location') || '. Our team will be in touch soon to discuss the next steps.',
      false,
      NOW(),
      NOW(),
      true
    ),
    (
      project_record.id,
      'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
      'New project created: ' || COALESCE(project_record.title, 'Untitled Project') || ' at ' || COALESCE(project_record.address, 'Unknown Address') || '. Please review project details and assign appropriate team members.',
      true,
      NOW(),
      NOW(),
      false
    ),
    (
      project_record.id,
      'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
      'Project Kickoff Checklist:
      ✓ Project created and documented
      ✓ Client notified
      ⏳ Site visit scheduled
      ⏳ Initial proposal prepared
      ⏳ Team assigned',
      true,
      NOW(),
      NOW(),
      false
    ),
    (
      project_record.id,
      'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
      'Next Steps for Client:
      1. We will schedule a site visit within 2-3 business days
      2. Our team will prepare a detailed proposal based on your requirements
      3. You will receive updates via email
      4. Feel free to reach out with any questions',
      false,
      NOW(),
      NOW(),
      false
    );
    
  RAISE NOTICE 'Default discussion assigned to project %', project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the manual function
COMMENT ON FUNCTION assign_default_discussion_to_existing_project(INTEGER) IS 
'Manually assigns default discussion comments to an existing project that was created before this trigger was implemented';

-- Example usage for existing projects:
-- SELECT assign_default_discussion_to_existing_project(123); -- Replace 123 with actual project ID
