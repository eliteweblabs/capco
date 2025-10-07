-- Export table structure
SELECT 
    'CREATE TABLE ' || tablename || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
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
    AND tablename = 'punchlist'
GROUP BY tablename;

-- Export indexes
SELECT indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
    AND tablename = 'punchlist';

-- Export functions
SELECT 
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN ('create_default_punchlist_items', 'auto_create_punchlist_items');

-- Export triggers
SELECT 
    'CREATE TRIGGER ' || tgname || ' ' ||
    CASE 
        WHEN tgtype & 2 > 0 THEN 'BEFORE'
        WHEN tgtype & 4 > 0 THEN 'AFTER'
        WHEN tgtype & 64 > 0 THEN 'INSTEAD OF'
    END || ' ' ||
    CASE 
        WHEN tgtype & 8 > 0 THEN 'INSERT'
        WHEN tgtype & 16 > 0 THEN 'DELETE'
        WHEN tgtype & 32 > 0 THEN 'UPDATE'
    END || ' ON ' || tgrelid::regclass || ' ' ||
    CASE tgtype & 1 
        WHEN 1 THEN 'FOR EACH ROW ' 
        ELSE 'FOR EACH STATEMENT ' 
    END ||
    'EXECUTE FUNCTION ' || tgfoid::regproc || '();'
FROM pg_trigger
WHERE tgrelid::regclass::text IN ('punchlist', 'projects')
    AND NOT tgisinternal;

-- Export RLS policies
SELECT 
    'CREATE POLICY ' || quote_ident(polname) || ' ON ' || tablename || ' ' ||
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
    END || ';' as policy_statement
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'punchlist';

-- Export sample data (first few rows)
SELECT * FROM punchlist LIMIT 5;

-- Export table constraints
SELECT 
    'ALTER TABLE ' || table_name || ' ADD CONSTRAINT ' || constraint_name || ' ' ||
    CASE 
        WHEN constraint_type = 'FOREIGN KEY' THEN
            'FOREIGN KEY (' || string_agg(column_name, ', ') || ') ' ||
            'REFERENCES ' || foreign_table_name || ' (' || string_agg(foreign_column_name, ', ') || ')'
        WHEN constraint_type = 'PRIMARY KEY' THEN
            'PRIMARY KEY (' || string_agg(column_name, ', ') || ')'
        ELSE ''
    END || ';' as constraint_definition
FROM (
    SELECT 
        tc.table_name, 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.table_name = 'punchlist'
        AND tc.table_schema = 'public'
) sub
GROUP BY table_name, constraint_name, constraint_type;
