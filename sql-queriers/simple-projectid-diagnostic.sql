-- =====================================================
-- SIMPLE DIAGNOSTIC: Find projectid references
-- =====================================================

-- 1. Check all functions that reference projectid
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ILIKE '%projectid%'
ORDER BY p.proname;

-- 2. Check all triggers
SELECT 
    t.trigger_name,
    t.event_object_table,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM information_schema.triggers t
WHERE pg_get_triggerdef(t.oid) ILIKE '%projectid%'
ORDER BY t.event_object_table, t.trigger_name;

-- 3. Check all table columns
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name ILIKE '%projectid%' OR column_name = 'project_id'
ORDER BY table_name, column_name;
