-- =====================================================
-- FIXED DEFAULT DISCUSSION TRIGGER FUNCTION
-- This fixes the string concatenation issue in the welcome message
-- =====================================================

-- Drop and recreate the function with fixed string concatenation
CREATE OR REPLACE FUNCTION assign_default_discussion_to_project()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- 🔧 EDIT THESE VALUES 🔧
  default_author_id UUID := 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17'; -- Replace with your admin user ID
  default_company_name TEXT := 'CAPCO Admin'; -- Replace with your company name
  
  -- Internal variables
  final_author_id UUID;
  final_company_name TEXT;
  welcome_message TEXT;
BEGIN
  -- Use default author ID (you can change logic here if needed)
  final_author_id := default_author_id;
  
  -- Use default company name
  final_company_name := default_company_name;

  -- Build the welcome message with proper string concatenation
  welcome_message := 'Welcome to your new project! We''re excited to work with you on ' || 
                     COALESCE(NEW.title, 'your project') || 
                     '. Please make sure to upload all relevant documents and images to the <a class="text-primary dark:text-primary-dark" href="/project/' || 
                     COALESCE(NEW.id::text, 'your-project') || 
                     '?status=documents">documents section</a>, and submit them by clicking the [Submit] button so we can review and develop a proposal';

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
    -- 1. Welcome message for the client (Client Visible)
    (
      NEW.id,
      final_author_id,
      welcome_message,
      false, -- Client visible
      NOW(),
      NOW(),
      false, -- Not completed by default
      final_company_name
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and is attached to the projects table
DROP TRIGGER IF EXISTS trigger_assign_default_discussion ON projects;

CREATE TRIGGER trigger_assign_default_discussion
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_discussion_to_project();

-- Add documentation comment
COMMENT ON TRIGGER trigger_assign_default_discussion ON projects IS 
'Automatically creates default discussion entries when a new project is created. Fixed string concatenation issue.';

COMMENT ON FUNCTION assign_default_discussion_to_project() IS 
'Creates default discussion entries for new projects with proper string concatenation.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed default discussion function successfully!';
  RAISE NOTICE '🔧 Fixed string concatenation issue in welcome message';
  RAISE NOTICE '📝 The function now properly builds the welcome message with project ID and title';
END $$;
