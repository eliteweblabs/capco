-- =====================================================
-- FIND ALL REMAINING PROJECT_ID REFERENCES
-- =====================================================
-- This script finds ALL functions, triggers, and constraints that still reference project_id
-- =====================================================

-- 1. Find all functions that still reference project_id
SELECT 
    'FUNCTIONS WITH PROJECT_ID REFERENCES:' as info,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%project_id%'
ORDER BY routine_name;

-- 2. Find all triggers that might be causing issues
SELECT 
    'TRIGGERS ON DISCUSSION TABLE:' as info,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'discussion'
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- 3. Find all constraints that might reference project_id
SELECT 
    'CONSTRAINTS WITH PROJECT_ID:' as info,
    constraint_name,
    table_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE constraint_name ILIKE '%project_id%'
AND table_schema = 'public'
ORDER BY table_name, constraint_name;

-- 4. Find all foreign key constraints
SELECT 
    'FOREIGN KEY CONSTRAINTS:' as info,
    tc.constraint_name,
    tc.table_name,
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
AND tc.table_schema = 'public'
AND (kcu.column_name ILIKE '%project%' OR ccu.column_name ILIKE '%project%')
ORDER BY tc.table_name, tc.constraint_name;

-- 5. Check if there are any views that reference project_id
SELECT 
    'VIEWS WITH PROJECT_ID:' as info,
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition ILIKE '%project_id%'
AND table_schema = 'public'
ORDER BY table_name;
