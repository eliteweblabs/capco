-- Fix Punchlist Functions to Use camelCase Column Names
-- This script updates all punchlist functions to use the correct camelCase column names

-- ==============================================
-- 1. UPDATE THE AUTO-CREATE FUNCTION TO USE CAMELCASE
-- ==============================================

-- Function to create default punchlist items for new projects
-- Updated to use camelCase column names to match the database schema
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
    project_author_id UUID;
    author_company_name TEXT;
    base_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the project author's ID using camelCase column name
    SELECT "authorId" INTO project_author_id 
    FROM projects 
    WHERE id = project_id_param;
    
    -- Get the author's company name from profiles using camelCase column names
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

    -- Insert default punchlist items using camelCase column names
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 2. UPDATE THE TRIGGER FUNCTION
-- ==============================================

-- Update the trigger function to run with elevated privileges
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
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
-- 3. VERIFY THE FUNCTION WORKS
-- ==============================================

-- Check if the function exists and is correct
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'create_default_punchlist_items';

-- ==============================================
-- 4. VERIFY FOREIGN KEY CONSTRAINT EXISTS
-- ==============================================

-- Check that the foreign key constraint exists with the correct name
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'punchlist'
  AND kcu.column_name = 'authorId';

