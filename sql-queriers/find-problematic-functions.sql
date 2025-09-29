-- Find the specific functions that are causing the company_name error
-- Run each section separately to get detailed results

-- 1. Find all functions that reference company_name
SELECT 
    routine_name as function_name,
    'References company_name' as issue_type,
    routine_definition as function_code
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- 2. Find all triggers on projects table
SELECT 
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement as trigger_definition
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- 3. Find all triggers on profiles table
SELECT 
    trigger_name,
    event_manipulation as event,
    action_timing as timing,
    action_statement as trigger_definition
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 4. Check if company_name column exists in projects table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name = 'company_name';
