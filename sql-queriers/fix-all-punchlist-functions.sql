-- Fix All Punchlist Functions to Use Correct User ID
-- This script updates all punchlist functions to use the correct admin user ID

-- ==============================================
-- 1. VERIFY THE CORRECT ADMIN USER
-- ==============================================

-- Check the correct admin user
SELECT 
  id, 
  "firstName", 
  "lastName", 
  "companyName", 
  role,
  email
FROM profiles 
WHERE id = 'd807fb34-a10c-4d76-bc20-13b421c44bf7';

-- ==============================================
-- 2. DROP AND RECREATE ALL PUNCHLIST FUNCTIONS
-- ==============================================

-- Drop existing trigger first (it depends on the function)
DROP TRIGGER IF EXISTS trigger_auto_create_punchlist ON projects;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS create_default_punchlist_items(INTEGER);
DROP FUNCTION IF EXISTS auto_create_punchlist_items();

-- ==============================================
-- 3. CREATE UPDATED PUNCHLIST FUNCTIONS
-- ==============================================

-- Function to create default punchlist items using the correct admin user
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
    project_author_id UUID;
    author_company_name TEXT;
    base_time TIMESTAMP WITH TIME ZONE;
BEGIN
     -- Get the project author's ID and company name
     SELECT "authorId" INTO project_author_id 
     FROM projects 
     WHERE id = project_id_param;
     
     -- Get the author's company name from profiles
     SELECT COALESCE("companyName", "firstName" || ' ' || "lastName", 'Unknown User') 
     INTO author_company_name
     FROM profiles 
     WHERE id = project_author_id;
    
    -- If we couldn't find the author, use the correct admin user as fallback
    IF project_author_id IS NULL THEN
        project_author_id := 'd807fb34-a10c-4d76-bc20-13b421c44bf7';
        author_company_name := 'CAPCo Fire';
        RAISE NOTICE 'Using fallback admin user for project %', project_id_param;
    END IF;

    -- Use current time as base, add seconds to ensure proper ordering
    base_time := NOW();

     -- Insert default punchlist items with incremental timestamps for proper ordering
     INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "companyName", "createdAt")
     VALUES 
     (project_id_param, project_author_id, 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, author_company_name, base_time + INTERVAL '1 second'),
     (project_id_param, project_author_id, 'Obtain fire hydrant flow test data', false, false, author_company_name, base_time + INTERVAL '2 seconds'),
     (project_id_param, project_author_id, 'Conduct design kickoff and review scope', false, false, author_company_name, base_time + INTERVAL '3 seconds'),
     (project_id_param, project_author_id, 'Coordinate with fire alarm designer', false, false, author_company_name, base_time + INTERVAL '4 seconds'),
     (project_id_param, project_author_id, 'Complete fire sprinkler layout design', false, false, author_company_name, base_time + INTERVAL '5 seconds'),
     (project_id_param, project_author_id, 'Perform hydraulic calculations', false, false, author_company_name, base_time + INTERVAL '6 seconds'),
     (project_id_param, project_author_id, 'Optimize pipe sizing for efficiency', false, false, author_company_name, base_time + INTERVAL '7 seconds'),
     (project_id_param, project_author_id, 'Add notes and leader callouts', false, false, author_company_name, base_time + INTERVAL '8 seconds'),  
     (project_id_param, project_author_id, 'Add details and general notes', false, false, author_company_name, base_time + INTERVAL '9 seconds'),
     (project_id_param, project_author_id, 'Finalize design and apply titleblock', false, false, author_company_name, base_time + INTERVAL '10 seconds'),
     (project_id_param, project_author_id, 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, author_company_name, base_time + INTERVAL '11 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create punchlist items for new projects
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create punchlist items for new projects
    IF TG_OP = 'INSERT' THEN
        -- Call the function to create default punchlist items
        PERFORM create_default_punchlist_items(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. RECREATE THE TRIGGER
-- ==============================================

-- Create trigger on projects table to auto-create punchlist items
CREATE TRIGGER trigger_auto_create_punchlist
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_punchlist_items();

-- ==============================================
-- 5. VERIFY FUNCTIONS WERE CREATED
-- ==============================================

-- Check that the functions exist and use the correct user ID
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('create_default_punchlist_items', 'auto_create_punchlist_items')
  AND routine_schema = 'public';

-- ==============================================
-- 6. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '✅ All punchlist functions updated successfully!';
  RAISE NOTICE '🔧 Functions now use correct admin user: d807fb34-a10c-4d76-bc20-13b421c44bf7';
  RAISE NOTICE '📝 New projects will create punchlist items with valid user references';
  RAISE NOTICE '🎯 Foreign key constraint violations should be resolved';
END $$;
