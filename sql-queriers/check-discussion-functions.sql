-- Check all functions that might be triggered by discussion table operations
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND (pg_get_functiondef(p.oid) ILIKE '%discussion%' 
         OR pg_get_functiondef(p.oid) ILIKE '%projectid%'
         OR pg_get_functiondef(p.oid) ILIKE '%project_id%')
ORDER BY p.proname;
