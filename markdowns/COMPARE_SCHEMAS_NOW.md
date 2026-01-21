# Schema Comparison: Ready to Run

## Current Status

✅ **Rothco schema exported:**
- Tables: `rothco-schema-tables.json` (50 tables)
- Columns: `rothco-schema-columns.json` (being parsed)

## Next Steps

### Step 1: Export Capco Schema

Run these SQL queries on **Capco database** (https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql):

**Query 1 - Tables:**
```sql
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```
Save as: `capco-tables.json`

**Query 2 - Columns:**
```sql
SELECT 
  t.table_name,
  c.column_name,
  c.data_type,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.is_nullable,
  c.column_default,
  c.udt_name,
  c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;
```
Save as: `capco-columns.json`

### Step 2: Run Comparison

Once you have both schemas exported:

```bash
node scripts/sync-rothco-to-capco-schema.js \
  --capco-tables capco-tables.json \
  --capco-columns capco-columns.json \
  --rothco-tables rothco-schema-tables.json \
  --rothco-columns rothco-schema-columns.json \
  --output sync-rothco-to-capco.sql
```

### Step 3: Review and Apply Migration

1. Review `sync-rothco-to-capco.sql`
2. Apply to Rothco database via Supabase SQL Editor
3. Verify schemas match

## What Will Be Compared

- ✅ Table names (including casing)
- ✅ Column names (including casing)  
- ✅ Data types
- ✅ Nullability
- ✅ Default values
- ✅ Missing tables/columns
- ✅ Extra tables/columns
