-- Simple script to find ALL company_name references in your database
-- This will help you identify what's causing the error

-- Find all functions that reference company_name
SELECT 
    'FUNCTION: ' || routine_name as item,
    'References company_name' as issue
FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Find all triggers that might be calling these functions
SELECT 
    'TRIGGER: ' || trigger_name as item,
    'On table: ' || event_object_table as issue
FROM information_schema.triggers 
WHERE event_object_table IN ('projects', 'profiles')
ORDER BY trigger_name;

-- Find any views that reference company_name
SELECT 
    'VIEW: ' || table_name as item,
    'References company_name' as issue
FROM information_schema.views 
WHERE view_definition ILIKE '%company_name%'
AND table_schema = 'public'
ORDER BY table_name;

-- Check if company_name column still exists in projects table
SELECT 
    'COLUMN: ' || column_name as item,
    'In table: ' || table_name as issue
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name = 'company_name';
