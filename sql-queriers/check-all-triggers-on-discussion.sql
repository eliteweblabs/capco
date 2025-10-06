-- Check all triggers on the discussion table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'discussion'
ORDER BY trigger_name;
