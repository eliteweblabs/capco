# Schema Sync Guide: Make Rothco Match Capco (Master)

This guide helps you compare and sync the database schemas between Capco (master) and Rothco to ensure they match exactly, including table names, column names, and casing.

## Quick Start

### Option 1: Use Supabase MCP Tools (Recommended)

The Supabase MCP tools are currently connected to one project. Follow these steps:

1. **Export Capco Schema** (Master):
   - Connect MCP to Capco project (`qudlxlryegnainztkrtk`)
   - Run the queries in `sql-queriers/compare-capco-rothco-schema.sql`
   - Save results as JSON files:
     - `capco-tables.json`
     - `capco-columns.json`

2. **Export Rothco Schema**:
   - Connect MCP to Rothco project (`fhqglhcjlkusrykqnoel`)
   - Run the same queries
   - Save results as JSON files:
     - `rothco-tables.json`
     - `rothco-columns.json`

3. **Generate Migration SQL**:
   ```bash
   node scripts/sync-rothco-to-capco-schema.js \
     --capco-tables capco-tables.json \
     --capco-columns capco-columns.json \
     --rothco-tables rothco-tables.json \
     --rothco-columns rothco-columns.json \
     --output sync-migration.sql
   ```

4. **Review and Apply Migration**:
   - Review `sync-migration.sql`
   - Apply to Rothco database via Supabase SQL Editor

### Option 2: Use Supabase SQL Editor Directly

1. **On Capco Database** (https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql):
   
   Run Query 1 and Query 2 from `sql-queriers/compare-capco-rothco-schema.sql`:
   - Export results as CSV
   - Convert to JSON if needed

2. **On Rothco Database** (https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql):
   
   Run Query 3 and Query 4 from the same file:
   - Export results as CSV
   - Convert to JSON if needed

3. **Run Comparison Script**:
   ```bash
   node scripts/sync-rothco-to-capco-schema.js \
     --capco-tables capco-tables.json \
     --capco-columns capco-columns.json \
     --rothco-tables rothco-tables.json \
     --rothco-columns rothco-columns.json \
     --output sync-migration.sql
   ```

## What Gets Compared

The script compares:

1. **Tables**:
   - Missing tables in Rothco
   - Extra tables in Rothco
   - Table name casing differences

2. **Columns**:
   - Missing columns in Rothco tables
   - Extra columns in Rothco tables
   - Column name casing differences
   - Data type differences
   - Nullability differences
   - Default value differences

## Generated Migration SQL

The migration SQL includes:

1. **Table Renames**: Fixes table name casing to match Capco
2. **Column Renames**: Fixes column name casing to match Capco
3. **Missing Columns**: Adds columns that exist in Capco but not Rothco
4. **Missing Tables**: Lists tables that need to be created (requires manual CREATE TABLE statements)
5. **Extra Tables**: Lists tables in Rothco that don't exist in Capco (commented out for safety)

## Example Output

```sql
-- ============================================================================
-- Migration SQL: Make Rothco match Capco (Master) schema
-- Generated: 2025-01-XX...
-- ============================================================================

-- ============================================================================
-- STEP 1: Rename tables to match Capco casing
-- ============================================================================

ALTER TABLE IF EXISTS "projectStatuses" RENAME TO "project_statuses";
ALTER TABLE IF EXISTS "chatMessages" RENAME TO "chatMessages";

-- ============================================================================
-- STEP 2: Fix column differences
-- ============================================================================

-- Fix column casing in table "projects"
ALTER TABLE "projects" RENAME COLUMN "authorId" TO "author_id";
ALTER TABLE "projects" RENAME COLUMN "createdAt" TO "created_at";

-- Add missing columns to table "profiles"
ALTER TABLE "profiles" ADD COLUMN "phone_number" varchar(20) NULL;
```

## Verification

After applying migrations:

1. **Re-run comparison** to verify schemas match
2. **Test application** to ensure everything works
3. **Check for data issues** if column types changed

## Troubleshooting

### Issue: Cannot connect to both databases simultaneously

**Solution**: Export schemas separately and use file-based comparison.

### Issue: Migration fails due to existing data

**Solution**: 
- Review the migration SQL carefully
- May need to migrate data before renaming columns
- Consider creating a backup first

### Issue: Missing CREATE TABLE statements

**Solution**: 
- Export CREATE TABLE statements from Capco
- Use `pg_dump` or Supabase SQL Editor
- Add to migration SQL manually

## Files Created

- `sql-queriers/compare-capco-rothco-schema.sql` - SQL queries for schema export
- `scripts/sync-rothco-to-capco-schema.js` - Comparison and migration generator
- `scripts/compare-schemas-comprehensive.js` - Alternative comparison script
- `SCHEMA_SYNC_GUIDE.md` - This guide

## Next Steps

1. Export schemas from both databases
2. Run comparison script
3. Review generated migration SQL
4. Apply migrations to Rothco
5. Verify schemas match
6. Test application functionality
