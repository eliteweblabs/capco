-- Export all tables and their structures
SELECT 
    'CREATE TABLE ' || tablename || ' (' ||
    string_agg(
        quote_ident(column_name) || ' ' || data_type ||
        CASE 
            WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE 
            WHEN is_nullable = 'NO' THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE 
            WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
    ) || ');' as create_table_statement
FROM pg_catalog.pg_tables
JOIN information_schema.columns 
    ON tablename = table_name
WHERE schemaname = 'public'
GROUP BY tablename;

-- Export all functions
SELECT 
    n.nspname as schema,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition,
    CASE 
        WHEN p.prokind = 'f' THEN 'function'
        WHEN p.prokind = 'p' THEN 'procedure'
        WHEN p.prokind = 'a' THEN 'aggregate'
        WHEN p.prokind = 'w' THEN 'window'
        ELSE 'unknown'
    END as function_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Export all triggers
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE 
        WHEN tgtype & 2 > 0 THEN 'BEFORE'
        WHEN tgtype & 4 > 0 THEN 'AFTER'
        WHEN tgtype & 64 > 0 THEN 'INSTEAD OF'
    END as timing,
    CASE 
        WHEN tgtype & 8 > 0 THEN 'INSERT'
        WHEN tgtype & 16 > 0 THEN 'DELETE'
        WHEN tgtype & 32 > 0 THEN 'UPDATE'
    END as event,
    CASE tgtype & 1 
        WHEN 1 THEN 'FOR EACH ROW'
        ELSE 'FOR EACH STATEMENT'
    END as level,
    tgfoid::regproc as function_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgrelid::regclass::text, tgname;

-- Export all indexes
SELECT 
    schemaname as schema,
    tablename as table,
    indexname as index,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Export all constraints
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ') as columns,
    ccu.table_name as foreign_table,
    string_agg(ccu.column_name, ', ') as foreign_columns,
    'ALTER TABLE ' || tc.table_name || ' ADD CONSTRAINT ' || tc.constraint_name || ' ' ||
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            'FOREIGN KEY (' || string_agg(kcu.column_name, ', ') || ') ' ||
            'REFERENCES ' || ccu.table_name || ' (' || string_agg(ccu.column_name, ', ') || ')'
        WHEN tc.constraint_type = 'PRIMARY KEY' THEN
            'PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
        WHEN tc.constraint_type = 'UNIQUE' THEN
            'UNIQUE (' || string_agg(kcu.column_name, ', ') || ')'
        ELSE ''
    END || ';' as constraint_definition
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
GROUP BY tc.table_schema, tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name
ORDER BY tc.table_name, tc.constraint_name;

-- Export all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check,
    'CREATE POLICY ' || quote_ident(policyname) || ' ON ' || tablename || ' ' ||
    CASE 
        WHEN cmd = 'r' THEN 'FOR SELECT'
        WHEN cmd = 'a' THEN 'FOR INSERT'
        WHEN cmd = 'w' THEN 'FOR UPDATE'
        WHEN cmd = 'd' THEN 'FOR DELETE'
        WHEN cmd = '*' THEN 'FOR ALL'
    END || ' TO ' || roles::text || ' ' ||
    CASE 
        WHEN qual IS NOT NULL THEN 'USING (' || qual::text || ')'
        ELSE ''
    END || ' ' ||
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK (' || with_check::text || ')'
        ELSE ''
    END || ';' as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Export all grants/privileges
SELECT 
    grantor,
    grantee,
    table_schema,
    table_name,
    privilege_type,
    is_grantable,
    'GRANT ' || privilege_type || ' ON ' || table_schema || '.' || table_name || 
    ' TO ' || grantee || 
    CASE WHEN is_grantable = 'YES' THEN ' WITH GRANT OPTION' ELSE '' END || ';' as grant_statement
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- Export all sequences
SELECT 
    sequence_name,
    data_type,
    start_value,
    minimum_value,
    maximum_value,
    increment,
    cycle_option,
    'CREATE SEQUENCE ' || sequence_name || 
    ' INCREMENT ' || increment ||
    ' MINVALUE ' || minimum_value ||
    ' MAXVALUE ' || maximum_value ||
    ' START ' || start_value ||
    CASE WHEN cycle_option = 'YES' THEN ' CYCLE' ELSE ' NO CYCLE' END || ';' as create_sequence
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;
