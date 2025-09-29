-- Check which functions are actually active and working
-- This will help you identify duplicates and see what's currently running

-- Check all active triggers on projects table
SELECT 
    'ACTIVE TRIGGERS ON PROJECTS:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- Check all active triggers on profiles table  
SELECT 
    'ACTIVE TRIGGERS ON PROFILES:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- Check all functions that might be related to discussions
SELECT 
    'DISCUSSION-RELATED FUNCTIONS:' as info;
SELECT 
    routine_name,
    routine_type,
    created
FROM information_schema.routines 
WHERE routine_name ILIKE '%discussion%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Check all functions that might be related to company_name
SELECT 
    'COMPANY_NAME RELATED FUNCTIONS:' as info;
SELECT 
    routine_name,
    routine_type,
    created
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;
