-- Check if the elapsed_time functions are actually active in your database
-- This will show you what's currently working

-- Check if the functions exist
SELECT 'ELAPSED TIME FUNCTIONS:' as info;
SELECT 
    routine_name,
    routine_type,
    created
FROM information_schema.routines 
WHERE routine_name ILIKE '%elapsed%'
AND routine_schema = 'public'
ORDER BY routine_name;

-- Check if the triggers exist
SELECT 'ELAPSED TIME TRIGGERS:' as info;
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name ILIKE '%elapsed%'
ORDER BY trigger_name;

-- Check if the elapsed_time column exists
SELECT 'PROJECTS TABLE COLUMNS:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects'
AND column_name = 'elapsed_time';

-- Test if the functions work
SELECT 'TESTING FUNCTIONS:' as info;
-- This will show if the functions can be called
SELECT 'update_project_elapsed_time function exists' as test_result
WHERE EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'update_project_elapsed_time'
    AND routine_schema = 'public'
);
