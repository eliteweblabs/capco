-- Update Punchlist Functions to Use Correct Admin User ID
-- This script updates the hardcoded user ID in punchlist functions

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
-- 2. UPDATE CREATE_DEFAULT_PUNCHLIST_ITEMS FUNCTION
-- ==============================================

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
    
    -- If we couldn't find the author, exit
    IF project_author_id IS NULL THEN
        RAISE NOTICE 'Could not find author for project %', project_id_param;
        RETURN;
    END IF;

    -- Use current time as base, add seconds to ensure proper ordering
    base_time := NOW();

     -- Insert default punchlist items with incremental timestamps for proper ordering
     INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "companyName", "createdAt")
     VALUES 
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '1 second'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Obtain fire hydrant flow test data', false, false, 'CAPCo Fire', base_time + INTERVAL '2 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Conduct design kickoff and review scope', false, false, 'CAPCo Fire', base_time + INTERVAL '3 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Coordinate with fire alarm designer', false, false, 'CAPCo Fire', base_time + INTERVAL '4 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Complete fire sprinkler layout design', false, false, 'CAPCo Fire', base_time + INTERVAL '5 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Perform hydraulic calculations', false, false, 'CAPCo Fire', base_time + INTERVAL '6 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Optimize pipe sizing for efficiency', false, false, 'CAPCo Fire', base_time + INTERVAL '7 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Add notes and leader callouts', false, false, 'CAPCo Fire', base_time + INTERVAL '8 seconds'),  
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Add details and general notes', false, false, 'CAPCo Fire', base_time + INTERVAL '9 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Finalize design and apply titleblock', false, false, 'CAPCo Fire', base_time + INTERVAL '10 seconds'),
     (project_id_param, 'd807fb34-a10c-4d76-bc20-13b421c44bf7', 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '11 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 3. UPDATE AUTO_CREATE_PUNCHLIST_ITEMS FUNCTION
-- ==============================================

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
-- 4. UPDATE ASSIGN_DEFAULT_DISCUSSION_TO_PROJECT FUNCTION
-- ==============================================

CREATE OR REPLACE FUNCTION assign_default_discussion_to_project()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Use the correct admin user ID
  defaultAuthorId UUID := 'd807fb34-a10c-4d76-bc20-13b421c44bf7';
  defaultCompanyName TEXT := 'CAPCo Admin';
  
  -- Internal variables
  finalAuthorId UUID;
  finalCompanyName TEXT;
  welcomeMessage TEXT;
BEGIN
  -- Use default author ID
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

-- ==============================================
-- 5. VERIFY FUNCTIONS WERE UPDATED
-- ==============================================

-- Check the function definitions to confirm they use the correct user ID
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('create_default_punchlist_items', 'assign_default_discussion_to_project')
  AND routine_schema = 'public';

-- ==============================================
-- 6. SUCCESS MESSAGE
-- ==============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Updated punchlist functions to use correct admin user ID!';
  RAISE NOTICE '🔧 Functions now use: d807fb34-a10c-4d76-bc20-13b421c44bf7';
  RAISE NOTICE '📝 New projects will now create punchlist items with the correct author';
END $$;
