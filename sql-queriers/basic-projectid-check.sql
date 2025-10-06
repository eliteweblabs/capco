-- Basic check for projectid references

-- Check functions
SELECT proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ILIKE '%projectid%';

-- Check triggers  
SELECT trigger_name, event_object_table
FROM information_schema.triggers t
WHERE pg_get_triggerdef(t.oid) ILIKE '%projectid%';

-- Check columns
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name ILIKE '%projectid%' OR column_name = 'project_id';
