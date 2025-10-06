-- =====================================================
-- CHECK DATABASE COLUMNS
-- =====================================================
-- This script checks what columns actually exist in your database
-- to identify any remaining snake_case columns that need to be converted
-- =====================================================

-- Check projects table columns
SELECT 
    'PROJECTS TABLE COLUMNS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY column_name;

-- Check discussion table columns
SELECT 
    'DISCUSSION TABLE COLUMNS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'discussion' 
AND table_schema = 'public'
ORDER BY column_name;

-- Check files table columns
SELECT 
    'FILES TABLE COLUMNS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'files' 
AND table_schema = 'public'
ORDER BY column_name;

-- Check profiles table columns
SELECT 
    'PROFILES TABLE COLUMNS:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY column_name;

-- Check for any remaining snake_case columns
SELECT 
    'SNAKE_CASE COLUMNS FOUND:' as info,
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (
    column_name LIKE '%_%' 
    AND column_name NOT LIKE '%_id'  -- Exclude foreign key columns that might legitimately be snake_case
    AND column_name NOT LIKE '%_at'  -- Exclude timestamp columns that might legitimately be snake_case
)
ORDER BY table_name, column_name;

-- Check all functions that might reference old field names
SELECT 
    'FUNCTIONS WITH POTENTIAL ISSUES:' as info,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
    routine_definition ILIKE '%project_id%' OR
    routine_definition ILIKE '%author_id%' OR
    routine_definition ILIKE '%created_at%' OR
    routine_definition ILIKE '%updated_at%' OR
    routine_definition ILIKE '%mark_completed%' OR
    routine_definition ILIKE '%incomplete_discussions%'
)
ORDER BY routine_name;
