-- Check the remaining functions for company_name references
-- and remove them if they contain any

-- Check if these functions contain company_name references
SELECT 'FUNCTION DEFINITIONS WITH COMPANY_NAME:' as info;
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name IN ('create_default_punchlist_items', 'get_file_checkout_status', 'get_recent_conversations')
AND routine_schema = 'public';

-- Check for any remaining triggers
SELECT 'REMAINING TRIGGERS ON PROJECTS:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

SELECT 'REMAINING TRIGGERS ON PROFILES:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- If any of these functions contain company_name, drop them
-- (We'll add the DROP statements after checking their definitions)
