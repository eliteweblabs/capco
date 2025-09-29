-- Find the exact functions that are causing the company_name error
-- This will show you the function definitions so you can see what's wrong

-- Find all functions that contain 'company_name' in their definition
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Find all triggers that might be calling these functions
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('projects', 'profiles')
ORDER BY event_object_table, trigger_name;

-- Find any constraints or rules that might reference company_name
SELECT 
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'projects'
AND constraint_name ILIKE '%company%';
