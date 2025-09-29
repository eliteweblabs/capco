-- Find triggers that might be trying to sync company_name from profiles to projects
-- This will identify the exact trigger causing the error

-- Check all triggers on projects table that might be copying data from profiles
SELECT 
    'TRIGGERS ON PROJECTS TABLE:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- Check all triggers on profiles table that might affect projects
SELECT 
    'TRIGGERS ON PROFILES TABLE:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- Check if there are any functions that sync data between tables
SELECT 
    'FUNCTIONS THAT MIGHT SYNC DATA:' as info;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%projects%'
AND routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Check if company_name column still exists in projects table
SELECT 
    'COMPANY_NAME COLUMN CHECK:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name = 'company_name';
