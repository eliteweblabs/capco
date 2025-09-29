-- Export all functions and triggers to analyze for company_name references
-- This will give you a complete view of what's in your database

-- Export all functions with their full definitions
SELECT 
    'FUNCTION: ' || routine_name as function_info,
    routine_definition as full_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Export all triggers with their details
SELECT 
    'TRIGGER: ' || trigger_name as trigger_info,
    event_object_table as table_name,
    action_timing as timing,
    event_manipulation as event,
    action_statement as trigger_definition
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Search specifically for company_name references
SELECT 
    'COMPANY_NAME REFERENCE: ' || routine_name as function_with_company_name,
    routine_definition as definition_with_company_name
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Check for any constraints or rules that might reference company_name
SELECT 
    'CONSTRAINT: ' || constraint_name as constraint_info,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE constraint_name ILIKE '%company%'
OR table_name = 'projects';

-- Check for any views that might reference company_name
SELECT 
    'VIEW: ' || table_name as view_info,
    view_definition
FROM information_schema.views 
WHERE view_definition ILIKE '%company_name%'
AND table_schema = 'public';
