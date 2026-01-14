-- =====================================================
-- COMPLETE SCHEMA EXPORT SCRIPT
-- Run this in SOURCE project SQL Editor to generate
-- SQL statements that can be run in TARGET project
-- =====================================================

-- This script generates CREATE statements for:
-- - All tables with columns, constraints, defaults
-- - All functions
-- - All triggers  
-- - All RLS policies
-- - All indexes
-- - All views
-- - All sequences

-- =====================================================
-- PART 1: EXPORT ALL TABLE STRUCTURES
-- =====================================================
SELECT 
    '-- Table: ' || t.table_name || E'\n' ||
    'CREATE TABLE IF NOT EXISTS ' || quote_ident(t.table_name) || ' (' || E'\n' ||
    string_agg(
        '    ' || quote_ident(c.column_name) || ' ' ||
        CASE 
            WHEN c.data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(c.character_maximum_length::text, '255') || ')'
            WHEN c.data_type = 'character' THEN 'CHAR(' || COALESCE(c.character_maximum_length::text, '1') || ')'
            WHEN c.data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(c.numeric_precision::text, '') || 
                CASE WHEN c.numeric_scale > 0 THEN ',' || c.numeric_scale::text ELSE '' END || ')'
            WHEN c.data_type = 'USER-DEFINED' THEN 
                COALESCE(
                    (SELECT typname FROM pg_type WHERE typname = c.udt_name LIMIT 1),
                    quote_ident(c.udt_name)
                )
            ELSE UPPER(REPLACE(c.data_type, '_', ' '))
        END ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE 
            WHEN c.column_default IS NOT NULL AND c.column_default NOT LIKE 'nextval%' 
            THEN ' DEFAULT ' || c.column_default 
            WHEN c.column_default LIKE 'nextval%'
            THEN ' DEFAULT ' || c.column_default
            ELSE '' 
        END,
        ',' || E'\n'
        ORDER BY c.ordinal_position
    ) || E'\n' || ');' || E'\n' as create_table_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
GROUP BY t.table_name
ORDER BY t.table_name;

-- =====================================================
-- PART 2: EXPORT ALL FUNCTIONS
-- =====================================================
SELECT 
    '-- Function: ' || p.proname || E'\n' ||
    pg_get_functiondef(p.oid) || ';' || E'\n' as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p') -- functions and procedures
ORDER BY p.proname;

-- =====================================================
-- PART 3: EXPORT ALL TRIGGERS
-- =====================================================
SELECT 
    '-- Trigger: ' || tgname || ' on ' || tgrelid::regclass::text || E'\n' ||
    pg_get_triggerdef(oid) || ';' || E'\n' as trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
    AND tgrelid::regclass::text NOT LIKE 'pg_%'
ORDER BY tgrelid::regclass::text, tgname;

-- =====================================================
-- PART 4: EXPORT ALL RLS POLICIES
-- =====================================================
SELECT 
    '-- RLS Policy: ' || pol.polname || ' on ' || c.relname || E'\n' ||
    'CREATE POLICY ' || quote_ident(pol.polname) || ' ON ' || quote_ident(n.nspname) || '.' || quote_ident(c.relname) || E'\n' ||
    '    FOR ' || 
    CASE pol.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END || E'\n' ||
    CASE WHEN pol.polpermissive THEN '    PERMISSIVE' ELSE '    RESTRICTIVE' END || E'\n' ||
    '    TO ' || 
    CASE 
        WHEN pol.polroles = '{0}' THEN 'public'
        ELSE (SELECT string_agg(quote_ident(rolname), ', ') FROM pg_roles WHERE oid = ANY(pol.polroles))
    END || E'\n' ||
    CASE 
        WHEN pol.polqual IS NOT NULL THEN 
            '    USING (' || pg_get_expr(pol.polqual, pol.polrelid) || ')' || E'\n'
        ELSE ''
    END ||
    CASE 
        WHEN pol.polwithcheck IS NOT NULL THEN 
            '    WITH CHECK (' || pg_get_expr(pol.polwithcheck, pol.polrelid) || ')' || E'\n'
        ELSE ''
    END ||
    ';' || E'\n' as policy_definition
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, pol.polname;

-- =====================================================
-- PART 5: EXPORT ALL INDEXES (that aren't auto-created)
-- =====================================================
SELECT 
    '-- Index: ' || indexname || ' on ' || tablename || E'\n' ||
    indexdef || ';' || E'\n' as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey' -- Skip primary key indexes (created with table)
ORDER BY tablename, indexname;

-- =====================================================
-- PART 6: EXPORT ALL VIEWS
-- =====================================================
SELECT 
    '-- View: ' || table_name || E'\n' ||
    'CREATE OR REPLACE VIEW ' || quote_ident(table_name) || ' AS ' || E'\n' ||
    view_definition || ';' || E'\n' as view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- PART 7: EXPORT ALL SEQUENCES
-- =====================================================
SELECT 
    '-- Sequence: ' || s.sequence_name || E'\n' ||
    'CREATE SEQUENCE IF NOT EXISTS ' || quote_ident(s.sequence_name) || E'\n' ||
    '    START WITH ' || s.start_value ||
    '    INCREMENT BY ' || s.increment ||
    '    MINVALUE ' || s.minimum_value ||
    '    MAXVALUE ' || s.maximum_value ||
    CASE 
        WHEN seq.seqcache IS NOT NULL AND seq.seqcache > 0 THEN '    CACHE ' || seq.seqcache::text
        ELSE '    CACHE 1'
    END || ';' || E'\n' as sequence_definition
FROM information_schema.sequences s
LEFT JOIN pg_class c ON c.relname = s.sequence_name AND c.relkind = 'S'
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = s.sequence_schema
LEFT JOIN pg_sequence seq ON seq.seqrelid = c.oid
WHERE s.sequence_schema = 'public'
ORDER BY s.sequence_name;

-- =====================================================
-- PART 8: EXPORT FOREIGN KEY CONSTRAINTS
-- =====================================================
SELECT 
    '-- Foreign Key: ' || tc.constraint_name || ' on ' || tc.table_name || E'\n' ||
    'ALTER TABLE ' || quote_ident(tc.table_name) || E'\n' ||
    '    ADD CONSTRAINT ' || quote_ident(tc.constraint_name) || E'\n' ||
    '    FOREIGN KEY (' || string_agg(quote_ident(kcu.column_name), ', ' ORDER BY kcu.ordinal_position) || ')' || E'\n' ||
    '    REFERENCES ' || quote_ident(ccu.table_schema) || '.' || quote_ident(ccu.table_name) || 
    ' (' || string_agg(quote_ident(ccu.column_name), ', ' ORDER BY kcu.ordinal_position) || ')' || E'\n' ||
    CASE 
        WHEN rc.delete_rule != 'NO ACTION' THEN '    ON DELETE ' || rc.delete_rule || E'\n'
        ELSE ''
    END ||
    CASE 
        WHEN rc.update_rule != 'NO ACTION' THEN '    ON UPDATE ' || rc.update_rule || E'\n'
        ELSE ''
    END ||
    ';' || E'\n' as foreign_key_definition
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
LEFT JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
GROUP BY tc.table_name, tc.constraint_name, ccu.table_schema, ccu.table_name, rc.delete_rule, rc.update_rule
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Run each SELECT query above in SOURCE project SQL Editor
-- 2. Copy the results (they will be CREATE statements)
-- 3. Paste into TARGET project SQL Editor
-- 4. Run in TARGET project
-- 
-- OR use the automated script: scripts/clone-supabase-schema.sh
