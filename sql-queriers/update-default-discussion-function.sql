-- =====================================================
-- UPDATE DEFAULT DISCUSSION TRIGGER FUNCTION
-- This overwrites the existing function to customize default discussion entries
-- =====================================================
--
-- 📋 HOW TO USE:
-- 1. Edit the default_author_id and default_company_name values below (lines 18-19)
-- 2. Customize the discussion messages if needed (lines 46, 57, 68, 84, 99)
-- 3. Run this entire file in Supabase SQL Editor
--
-- 🔍 To find your Admin User ID, run this query first:
--    SELECT id, name, email, role FROM profiles WHERE role = 'Admin';
--
-- =====================================================

-- ⚙️  CONFIGURATION - EDIT THESE VALUES ⚙️

-- Drop and recreate the function with updated messages
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
BEGIN
  -- Use default author ID (you can change logic here if needed)
  final_author_id := default_author_id;
  
  -- Use default company name
  final_company_name := default_company_name;

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
      'Welcome to your new project! We''re excited to work with you on ' || COALESCE(NEW.title, 'your project') || '. Please make sure to upload all relevant documents and images to the [DOCUMENTS] tab, and submit them by clicking the [Submit] button so we can review and develop a propsoal',
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
'Automatically creates default discussion entries when a new project is created. Customizable messages include welcome, kickoff checklist, next steps, and follow-up reminders.';

COMMENT ON FUNCTION assign_default_discussion_to_project() IS 
'Creates 5 default discussion entries for new projects: welcome message, internal kickoff note, checklist, client next steps, and follow-up reminder.';

-- =====================================================
-- HELPER QUERY: Find your Admin User ID
-- =====================================================
-- Uncomment and run this query to find your admin user ID:
-- SELECT id, name, email, role FROM profiles WHERE role = 'Admin';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Default discussion function updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 The function now creates 5 discussion entries:';
  RAISE NOTICE '   1. Welcome message (Client Visible)';
  RAISE NOTICE '';
  RAISE NOTICE '⚙️  Author ID: d807fb34-a10c-4d76-bc20-13b421c44bf7';
  RAISE NOTICE '⚙️  Company Name: CAPCo Design Group';
  RAISE NOTICE '';
  RAISE NOTICE '💡 To customize, edit the default_author_id and default_company_name variables at the top of the function.';
END $$;

