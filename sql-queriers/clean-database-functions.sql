-- First, drop all triggers
DO $$ 
DECLARE 
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT DISTINCT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_rec.trigger_name) || ' ON ' || quote_ident(trigger_rec.event_object_table) || ' CASCADE;';
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
    END LOOP;
END $$;

-- Then drop all functions (except RLS policy functions)
DO $$ 
DECLARE 
    func_rec RECORD;
BEGIN
    FOR func_rec IN 
        SELECT ns.nspname as schema_name, p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as arg_list
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
        -- Exclude RLS policy functions (they start with 'policy')
        AND p.proname NOT LIKE 'policy%'
        -- Exclude trigger functions used by RLS
        AND p.proname NOT IN (
            SELECT regexp_replace(pol.polqual::text, '^.*\((.*)\).*$', '\1')
            FROM pg_policy pol
            WHERE pol.polqual IS NOT NULL
            UNION
            SELECT regexp_replace(pol.polwithcheck::text, '^.*\((.*)\).*$', '\1')
            FROM pg_policy pol
            WHERE pol.polwithcheck IS NOT NULL
        )
    LOOP
        -- Build and execute the DROP FUNCTION command
        BEGIN
            EXECUTE 'DROP FUNCTION IF EXISTS ' 
                || quote_ident(func_rec.schema_name) || '.' 
                || quote_ident(func_rec.function_name) 
                || '(' || func_rec.arg_list || ') CASCADE;';
            RAISE NOTICE 'Dropped function: %.%(%)', 
                func_rec.schema_name, 
                func_rec.function_name, 
                func_rec.arg_list;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop function %.%(%): %', 
                func_rec.schema_name, 
                func_rec.function_name, 
                func_rec.arg_list,
                SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify what's left
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;
