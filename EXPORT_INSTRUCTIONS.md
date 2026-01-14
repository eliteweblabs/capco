# Complete Schema Export Instructions

Your CSV only contains **foreign keys** (PART 8), but you need **all parts** to clone the complete schema.

## What You Need to Export

Run **each part separately** in your source project SQL Editor and export each as CSV:

### PART 1: Tables (REQUIRED - Missing!)
```sql
-- Run this in source project SQL Editor
-- Lines 19-50 from export-complete-schema.sql
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
```
**Export as:** `tables.csv`

### PART 2: Functions
```sql
-- Lines 55-62 from export-complete-schema.sql
SELECT 
    '-- Function: ' || p.proname || E'\n' ||
    pg_get_functiondef(p.oid) || ';' || E'\n' as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
ORDER BY p.proname;
```
**Export as:** `functions.csv`

### PART 3: Triggers
```sql
-- Lines 67-73 from export-complete-schema.sql
SELECT 
    '-- Trigger: ' || tgname || ' on ' || tgrelid::regclass::text || E'\n' ||
    pg_get_triggerdef(oid) || ';' || E'\n' as trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
    AND tgrelid::regclass::text NOT LIKE 'pg_%'
ORDER BY tgrelid::regclass::text, tgname;
```
**Export as:** `triggers.csv`

### PART 4: RLS Policies
```sql
-- Lines 78-110 from export-complete-schema.sql
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
```
**Export as:** `policies.csv`

### PART 5: Indexes
```sql
-- Lines 115-121 from export-complete-schema.sql
SELECT 
    '-- Index: ' || indexname || ' on ' || tablename || E'\n' ||
    indexdef || ';' || E'\n' as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;
```
**Export as:** `indexes.csv`

### PART 6: Views
```sql
-- Lines 126-132 from export-complete-schema.sql
SELECT 
    '-- View: ' || table_name || E'\n' ||
    'CREATE OR REPLACE VIEW ' || quote_ident(table_name) || ' AS ' || E'\n' ||
    view_definition || ';' || E'\n' as view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;
```
**Export as:** `views.csv`

### PART 7: Sequences
```sql
-- Lines 137-149 from export-complete-schema.sql
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
```
**Export as:** `sequences.csv`

### PART 8: Foreign Keys (You already have this!)
**You already exported:** `export.csv` ✅

## After Exporting All Parts

Convert all CSV files to SQL:

```bash
node scripts/csv-to-sql-fixed.js tables.csv functions.csv triggers.csv policies.csv indexes.csv views.csv sequences.csv export.csv
```

This will create a complete SQL file with everything!

## Quick Method: Export All at Once

Alternatively, you can copy the **entire export-complete-schema.sql** file, run all queries in SQL Editor, and export the **combined results** as one CSV. Then use the converter on that single file.
