-- Check ALL functions that reference discussion table
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ILIKE '%discussion%'
ORDER BY p.proname;
