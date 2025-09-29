-- Check for any remaining triggers that might be causing the company_name error
-- This will help identify what's still active

-- Check all triggers on projects table
SELECT 
    'TRIGGERS ON PROJECTS:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- Check all triggers on profiles table
SELECT 
    'TRIGGERS ON PROFILES:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- Check if company_name column exists in projects table
SELECT 
    'COMPANY_NAME COLUMN IN PROJECTS:' as info;
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name = 'company_name';

-- Check all functions that might reference company_name
SELECT 
    'FUNCTIONS WITH COMPANY_NAME:' as info;
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;
