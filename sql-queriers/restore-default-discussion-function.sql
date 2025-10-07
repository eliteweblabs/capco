-- Restore the default discussion function with correct field names
CREATE OR REPLACE FUNCTION assign_default_discussion_to_project()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- 🔧 EDIT THESE VALUES 🔧
  defaultAuthorId UUID := 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17'; -- Replace with your admin user ID
  defaultCompanyName TEXT := 'CAPCO Admin'; -- Replace with your company name
  
  -- Internal variables
  finalAuthorId UUID;
  finalCompanyName TEXT;
  welcomeMessage TEXT;
BEGIN
  -- Use default author ID (you can change logic here if needed)
  finalAuthorId := defaultAuthorId;
  
  -- Use default company name
  finalCompanyName := defaultCompanyName;

  -- Build the welcome message with proper string concatenation
  welcomeMessage := 'Welcome to your new project! We''re excited to work with you on ' || 
                     COALESCE(NEW.title, 'your project') || 
                     '. Please make sure to upload all relevant documents and images to the <a class="text-primary dark:text-primary-dark" href="/project/' || 
                     COALESCE(NEW.id::text, 'your-project') || 
                     '?status=documents">documents section</a>, and submit them by clicking the [Submit] button so we can review and develop a proposal';

  -- Insert default discussion comments for the new project
  INSERT INTO discussion (
    "projectId",
    "authorId",
    message,
    internal,
    "createdAt",
    "updatedAt",
    "markCompleted",
    "companyName"
  ) VALUES 
    -- 1. Welcome message for the client (Client Visible)
    (
      NEW.id,
      finalAuthorId,
      welcomeMessage,
      false, -- Client visible
      NOW(),
      NOW(),
      false, -- Not completed by default
      finalCompanyName
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_assign_default_discussion
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_discussion_to_project();

-- Add documentation
COMMENT ON FUNCTION assign_default_discussion_to_project() IS 
'Creates default discussion entries for new projects with proper camelCase field names.';

COMMENT ON TRIGGER trigger_assign_default_discussion ON projects IS 
'Automatically creates default discussion entries when a new project is created.';
