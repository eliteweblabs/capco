-- EMERGENCY: Drop all functions that might be causing company_name errors
-- This is a more aggressive approach to fix the issue

-- Drop all the functions we know are problematic
DROP FUNCTION IF EXISTS sync_company_name_to_projects();
DROP FUNCTION IF EXISTS set_company_name_on_project_insert();
DROP FUNCTION IF EXISTS assign_default_discussion_to_existing_project(integer);
DROP FUNCTION IF EXISTS assign_default_discussion_to_project(integer);

-- Drop any triggers that might be calling these functions
DROP TRIGGER IF EXISTS trigger_sync_company_name_to_projects ON profiles;
DROP TRIGGER IF EXISTS trigger_set_company_name_on_project_insert ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_existing_project ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_project ON projects;

-- Also drop any other triggers that might be causing issues
DROP TRIGGER IF EXISTS trigger_create_default_discussions ON projects;
DROP TRIGGER IF EXISTS trigger_create_default_discussions_manual ON projects;

-- Drop the functions that create default discussions (they might reference company_name)
DROP FUNCTION IF EXISTS create_default_discussions();
DROP FUNCTION IF EXISTS create_default_discussions_manual(integer);

-- Verify what's left
SELECT 'Remaining functions with company_name:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%' 
AND routine_schema = 'public';

SELECT 'Remaining triggers on projects:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'projects';

SELECT 'Remaining triggers on profiles:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
