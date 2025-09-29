-- Drop the specific trigger and function that's causing the company_name error
-- This is the exact issue: trigger_sync_company_name calling sync_company_name_to_projects()

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_sync_company_name ON profiles;

-- Drop the function
DROP FUNCTION IF EXISTS sync_company_name_to_projects();

-- Verify they're gone
SELECT 'Remaining triggers on profiles:' as info;
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
AND trigger_name ILIKE '%company%';

SELECT 'Remaining functions with company_name:' as info;
SELECT routine_name FROM information_schema.routines 
WHERE routine_definition ILIKE '%company_name%'
AND routine_schema = 'public';
