-- First, reassign ownership of schemas to postgres
DO $$ 
DECLARE 
    schema_rec RECORD;
BEGIN
    FOR schema_rec IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name IN ('auth', 'extensions', 'storage', 'realtime', 'pgsodium')
        OR schema_name LIKE 'supabase%'
    LOOP
        -- Try to change ownership
        BEGIN
            EXECUTE format('ALTER SCHEMA %I OWNER TO postgres;', schema_rec.schema_name);
            RAISE NOTICE 'Changed ownership of schema % to postgres', schema_rec.schema_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not change ownership of schema %: %', schema_rec.schema_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop schemas one by one with error handling
DO $$ 
DECLARE 
    schema_rec RECORD;
BEGIN
    FOR schema_rec IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name IN ('auth', 'extensions', 'storage', 'realtime', 'pgsodium')
        OR schema_name LIKE 'supabase%'
    LOOP
        BEGIN
            -- Try to drop the schema
            EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE;', schema_rec.schema_name);
            RAISE NOTICE 'Dropped schema: %', schema_rec.schema_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop schema %: %', schema_rec.schema_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop Supabase specific extensions with error handling
DO $$
DECLARE
    ext_rec RECORD;
BEGIN
    FOR ext_rec IN
        SELECT extname 
        FROM pg_extension 
        WHERE extname IN (
            'pgjwt',
            'pgcrypto',
            'pgsodium',
            'supabase_vault',
            'uuid-ossp',
            'http',
            'pg_graphql',
            'pg_stat_statements',
            'pgaudit',
            'plpgsql',
            'moddatetime'
        )
    LOOP
        BEGIN
            EXECUTE format('DROP EXTENSION IF EXISTS %I CASCADE;', ext_rec.extname);
            RAISE NOTICE 'Dropped extension: %', ext_rec.extname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop extension %: %', ext_rec.extname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop Supabase specific functions from public schema
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    FOR func_rec IN
        SELECT ns.nspname as schema_name, 
               p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as arg_list
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
        AND (
            p.proname LIKE 'supabase%'
            OR p.proname LIKE 'extension%'
            OR p.proname LIKE 'auth%'
            OR p.proname LIKE 'storage%'
            OR p.proname LIKE 'graphql%'
            OR p.proname LIKE 'vault%'
            OR p.proname LIKE 'realtime%'
        )
    LOOP
        BEGIN
            EXECUTE format(
                'DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE;',
                func_rec.schema_name,
                func_rec.function_name,
                func_rec.arg_list
            );
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

-- Drop Supabase specific triggers from public schema
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN
        SELECT DISTINCT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND (
            trigger_name LIKE 'supabase%'
            OR trigger_name LIKE 'auth%'
            OR trigger_name LIKE 'storage%'
            OR trigger_name LIKE 'realtime%'
        )
    LOOP
        BEGIN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS %I ON %I CASCADE;',
                trigger_rec.trigger_name,
                trigger_rec.event_object_table
            );
            RAISE NOTICE 'Dropped trigger: %', trigger_rec.trigger_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop trigger %: %', trigger_rec.trigger_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Verify what's left
SELECT 
    n.nspname as schema_name,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    p.proname LIKE 'supabase%'
    OR p.proname LIKE 'extension%'
    OR p.proname LIKE 'auth%'
    OR p.proname LIKE 'storage%'
    OR p.proname LIKE 'graphql%'
    OR p.proname LIKE 'vault%'
    OR p.proname LIKE 'realtime%'
)
ORDER BY n.nspname, p.proname;

-- Show remaining extensions
SELECT * FROM pg_extension;