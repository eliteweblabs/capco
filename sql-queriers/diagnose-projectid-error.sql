-- =====================================================
-- DIAGNOSTIC SCRIPT: Find ALL projectid references
-- =====================================================
-- This script will help us find exactly what's still referencing projectid
-- =====================================================

-- 1. Check all foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.constraint_name LIKE '%projectid%' OR tc.constraint_name LIKE '%project_id%')
ORDER BY tc.table_name;

-- 2. Check all functions that might reference projectid
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND pg_get_functiondef(p.oid) ILIKE '%projectid%'
ORDER BY p.proname;

-- 3. Check all triggers
SELECT 
    t.trigger_name,
    t.event_object_table,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM information_schema.triggers t
WHERE pg_get_triggerdef(t.oid) ILIKE '%projectid%'
ORDER BY t.event_object_table, t.trigger_name;

-- 4. Check all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexdef ILIKE '%projectid%'
ORDER BY tablename, indexname;

-- 5. Check all table columns for any remaining projectid references
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name ILIKE '%projectid%'
ORDER BY table_name, column_name;

-- 6. Check for any remaining snake_case project_id columns
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'project_id'
ORDER BY table_name;
