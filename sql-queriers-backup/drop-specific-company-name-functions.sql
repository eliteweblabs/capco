-- Drop the specific functions that are causing the company_name error
-- These functions are trying to reference company_name in projects table

-- Drop the functions that are definitely causing issues
DROP FUNCTION IF EXISTS sync_company_name_to_projects();
DROP FUNCTION IF EXISTS set_company_name_on_project_insert();
DROP FUNCTION IF EXISTS assign_default_discussion_to_existing_project(integer);
DROP FUNCTION IF EXISTS assign_default_discussion_to_project(integer);

-- Also drop any triggers that might be calling these functions
DROP TRIGGER IF EXISTS trigger_sync_company_name_to_projects ON profiles;
DROP TRIGGER IF EXISTS trigger_set_company_name_on_project_insert ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_existing_project ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_project ON projects;

-- Verify the functions are gone
SELECT 'Remaining functions with company_name:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%' 
AND routine_schema = 'public'
AND routine_name IN (
    'sync_company_name_to_projects',
    'set_company_name_on_project_insert', 
    'assign_default_discussion_to_existing_project',
    'assign_default_discussion_to_project'
);
