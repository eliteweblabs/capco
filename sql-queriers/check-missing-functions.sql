-- Check what functions are missing and what they might have been doing
-- This will help identify which functions were actually necessary

-- Check what functions still exist
SELECT 'REMAINING FUNCTIONS:' as info;
SELECT routine_name, routine_type, created
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check what triggers still exist
SELECT 'REMAINING TRIGGERS:' as info;
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check if we have any issues with missing functionality
SELECT 'CHECKING FOR MISSING FUNCTIONALITY:' as info;

-- Check if we have any orphaned triggers (triggers calling non-existent functions)
SELECT 
    'ORPHANED TRIGGER: ' || trigger_name as issue,
    'Calls function that might not exist' as problem
FROM information_schema.triggers 
WHERE action_statement NOT LIKE '%EXECUTE FUNCTION%'
OR action_statement LIKE '%EXECUTE FUNCTION%'
ORDER BY trigger_name;
