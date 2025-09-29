-- Remove ALL triggers on projects table to eliminate company_name errors
-- This is a nuclear approach to fix the issue

-- Drop ALL triggers on projects table
DROP TRIGGER IF EXISTS trigger_set_assigned_to_name_on_insert ON projects;
DROP TRIGGER IF EXISTS trigger_set_assigned_to_name_on_update ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_project ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_existing_project ON projects;
DROP TRIGGER IF EXISTS trigger_create_default_discussions ON projects;
DROP TRIGGER IF EXISTS trigger_create_default_discussions_manual ON projects;
DROP TRIGGER IF EXISTS trigger_sync_company_name ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_assigned_to_name ON profiles;
DROP TRIGGER IF EXISTS trigger_set_company_name_on_project_insert ON projects;
DROP TRIGGER IF EXISTS trigger_set_company_name_on_project_update ON projects;

-- Drop ALL functions that might reference company_name
DROP FUNCTION IF EXISTS set_assigned_to_name_on_project_insert();
DROP FUNCTION IF EXISTS set_assigned_to_name_on_project_update();
DROP FUNCTION IF EXISTS sync_assigned_to_name_to_projects();
DROP FUNCTION IF EXISTS assign_default_discussion_to_project();
DROP FUNCTION IF EXISTS assign_default_discussion_to_existing_project(integer);
DROP FUNCTION IF EXISTS create_default_discussions();
DROP FUNCTION IF EXISTS create_default_discussions_manual(integer);
DROP FUNCTION IF EXISTS sync_company_name_to_projects();
DROP FUNCTION IF EXISTS set_company_name_on_project_insert();
DROP FUNCTION IF EXISTS set_company_name_on_project_update();

-- Verify everything is gone
SELECT 'REMAINING TRIGGERS ON PROJECTS:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

SELECT 'REMAINING TRIGGERS ON PROFILES:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

SELECT 'REMAINING FUNCTIONS WITH COMPANY_NAME:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;
