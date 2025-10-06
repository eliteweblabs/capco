-- Simple list of functions
SELECT proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'array_%'
    AND p.proname NOT LIKE 'string_%'
    AND p.proname NOT LIKE 'to_%'
    AND p.proname NOT LIKE 'format_%'
    AND p.proname NOT LIKE 'coalesce'
    AND p.proname NOT LIKE 'greatest'
    AND p.proname NOT LIKE 'least'
    AND p.proname NOT LIKE 'now'
    AND p.proname NOT LIKE 'current_%'
    AND p.proname NOT LIKE 'gen_random_%'
    AND p.proname NOT LIKE 'auth.%'
ORDER BY p.proname;
