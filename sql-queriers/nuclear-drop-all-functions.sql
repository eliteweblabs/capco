-- =====================================================
-- NUCLEAR OPTION: Drop ALL functions and triggers
-- =====================================================
-- This will drop every function and trigger so we can start fresh
-- =====================================================

-- Drop ALL triggers first
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_table;
    END LOOP;
END $$;

-- Drop ALL functions
DO $$
DECLARE
    function_record RECORD;
BEGIN
    FOR function_record IN 
        SELECT proname, oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname NOT LIKE 'pg_%'
        AND p.proname NOT LIKE 'array_%'
        AND p.proname NOT LIKE 'string_%'
        AND p.proname NOT LIKE 'to_%'
        AND p.proname NOT LIKE 'format_%'
        AND p.proname NOT LIKE 'coalesce'
        AND p.proname NOT LIKE 'greatest'
        AND p.proname NOT LIKE 'least'
        AND p.proname NOT LIKE 'now'
        AND p.proname NOT LIKE 'current_%'
        AND p.proname NOT LIKE 'gen_random_%'
        AND p.proname NOT LIKE 'auth.%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || function_record.proname || ' CASCADE';
    END LOOP;
END $$;

-- Success message
SELECT '✅ ALL functions and triggers have been dropped!' as status;
