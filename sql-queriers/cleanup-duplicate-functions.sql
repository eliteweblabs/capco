-- Clean up duplicate functions and keep only the working ones
-- This will help you identify and remove redundant functions

-- Drop the old/deprecated functions that are likely duplicates
DROP FUNCTION IF EXISTS assign_default_discussion_to_existing_project(integer);
DROP FUNCTION IF EXISTS assign_default_discussion_to_project(integer);
DROP FUNCTION IF EXISTS create_default_discussions();
DROP FUNCTION IF EXISTS create_default_discussions_manual(integer);

-- Drop the old company_name related functions
DROP FUNCTION IF EXISTS sync_company_name_to_projects();
DROP FUNCTION IF EXISTS set_company_name_on_project_insert();

-- Drop the old triggers
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_existing_project ON projects;
DROP TRIGGER IF EXISTS trigger_assign_default_discussion_to_project ON projects;
DROP TRIGGER IF EXISTS trigger_create_default_discussions ON projects;
DROP TRIGGER IF EXISTS trigger_create_default_discussions_manual ON projects;
DROP TRIGGER IF EXISTS trigger_sync_company_name_to_projects ON profiles;
DROP TRIGGER IF EXISTS trigger_set_company_name_on_project_insert ON projects;

-- Keep only the essential functions (if they exist)
-- These are the ones that should be working:
-- - assign_default_discussion_to_project (the main one)
-- - create_default_discussions (the main one)

-- Verify what's left
SELECT 'REMAINING ACTIVE TRIGGERS:' as info;
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('projects', 'profiles')
ORDER BY event_object_table, trigger_name;

SELECT 'REMAINING DISCUSSION FUNCTIONS:' as info;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name ILIKE '%discussion%'
AND routine_schema = 'public'
ORDER BY routine_name;
