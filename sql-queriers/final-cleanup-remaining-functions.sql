-- Final cleanup: Remove remaining functions that might be causing issues
-- These functions are not essential for basic project creation

-- Drop the remaining functions
DROP FUNCTION IF EXISTS create_default_punchlist_items() CASCADE;
DROP FUNCTION IF EXISTS get_file_checkout_status() CASCADE;
DROP FUNCTION IF EXISTS get_recent_conversations() CASCADE;

-- Final verification - should show no triggers or company_name functions
SELECT 'FINAL CHECK - REMAINING TRIGGERS ON PROJECTS:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

SELECT 'FINAL CHECK - REMAINING TRIGGERS ON PROFILES:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

SELECT 'FINAL CHECK - REMAINING FUNCTIONS WITH COMPANY_NAME:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public'
ORDER BY routine_name;

SELECT 'FINAL CHECK - ALL REMAINING FUNCTIONS:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
