-- NUCLEAR OPTION: Drop ALL triggers and functions that might reference company_name
-- This will completely remove any triggers that might be causing the error

-- Drop ALL triggers on projects table
DROP TRIGGER IF EXISTS trigger_set_assigned_to_name_on_insert ON projects;
DROP TRIGGER IF EXISTS trigger_set_assigned_to_name_on_update ON projects;
DROP TRIGGER IF EXISTS trigger_sync_assigned_to_name ON profiles;
DROP TRIGGER IF EXISTS trigger_create_default_discussions ON projects;
DROP TRIGGER IF EXISTS trigger_create_default_discussions_manual ON projects;

-- Drop ALL functions that might reference company_name
DROP FUNCTION IF EXISTS set_assigned_to_name_on_project_insert();
DROP FUNCTION IF EXISTS set_assigned_to_name_on_project_update();
DROP FUNCTION IF EXISTS sync_assigned_to_name_to_projects();
DROP FUNCTION IF EXISTS create_default_discussions();
DROP FUNCTION IF EXISTS create_default_discussions_manual(integer);

-- Verify no triggers remain
SELECT 'Remaining triggers on projects:' as info;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'projects';

SELECT 'Remaining triggers on profiles:' as info;
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';

SELECT 'Functions containing company_name:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%' 
AND routine_schema = 'public';
