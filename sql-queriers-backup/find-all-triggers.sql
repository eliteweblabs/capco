-- Find all triggers and functions that might be causing the company_name error
-- Run this to see what triggers are still active

-- List all triggers on the projects table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects';

-- List all functions that might reference company_name
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public';

-- List all triggers on profiles table that might affect projects
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
