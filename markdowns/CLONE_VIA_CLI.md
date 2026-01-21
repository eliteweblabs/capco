# Clone Database Schema via CLI (Terminal Automation)

Since there's no Supabase MCP server available, this uses **Supabase CLI via terminal commands** to automate the schema clone process.

## Quick Start

```bash
# Clone entire schema from source to target
./scripts/clone-schema-automated.sh qudlxlryegnainztkrtk fhqglhcjlkusrykqnoel
```

## Prerequisites

1. **Supabase CLI installed** ✓
   ```bash
   npm install -g supabase
   ```

2. **Logged into Supabase CLI:**
   ```bash
   supabase login
   ```

## How It Works

The script uses terminal commands to:

1. ✅ **Link to source project** - `supabase link --project-ref [SOURCE]`
2. ✅ **Export schema** - `supabase db dump --schema-only`
3. ✅ **Link to target project** - `supabase link --project-ref [TARGET]`
4. ✅ **Import schema** - `supabase db execute --file [SCHEMA_FILE]`
5. ✅ **Clean up** - Unlink from projects

## What Gets Cloned

**Complete database schema:**
- ✅ All tables (structure, columns, constraints)
- ✅ All functions and procedures
- ✅ All triggers
- ✅ All RLS policies
- ✅ All indexes
- ✅ All views
- ✅ All sequences
- ✅ All foreign keys

**Does NOT clone:**
- ❌ Data (rows) - Only structure
- ❌ Storage buckets
- ❌ Auth users

## Usage

### Basic Usage

```bash
./scripts/clone-schema-automated.sh
```

Uses default projects:
- Source: `qudlxlryegnainztkrtk`
- Target: `fhqglhcjlkusrykqnoel`

### Custom Projects

```bash
./scripts/clone-schema-automated.sh [SOURCE_REF] [TARGET_REF]
```

Example:
```bash
./scripts/clone-schema-automated.sh qudlxlryegnainztkrtk fhqglhcjlkusrykqnoel
```

## Process Flow

```
1. Check Supabase CLI installed
2. Check authentication
3. Link to source project
4. Export schema → schema-export.sql
5. Unlink from source
6. Link to target project
7. Confirm import
8. Import schema
9. Unlink from target
10. Show results
```

## Output Files

The script creates temporary files:
- `schema-export-[timestamp].sql` - Complete schema export
- `link-source.log` - Source linking log
- `link-target.log` - Target linking log
- `import-[timestamp].log` - Import execution log

All files are saved in a temp directory and paths are shown at the end.

## Troubleshooting

### Error: "Access token not provided"

**Solution:** Login to Supabase CLI
```bash
supabase login
```

### Error: "Could not link to project"

**Solution:** Link manually first
```bash
supabase link --project-ref qudlxlryegnainztkrtk
```

Then run the script again.

### Error: "Export file is empty"

**Possible causes:**
- Project doesn't exist
- No access to project
- Network issues

**Solution:** Export manually using SQL Editor method (script will guide you)

### Error: "relation already exists"

**Normal!** These warnings can be ignored. The script uses `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` to handle existing objects.

### Import hangs or is slow

- Large schemas can take 5-15 minutes
- This is normal
- Be patient and let it complete

## Manual Fallback

If automatic export fails, the script will guide you through manual export:

1. **SQL Editor Method:**
   - Go to source project SQL Editor
   - Run queries from `sql-queriers/export-complete-schema.sql`
   - Copy CREATE statements
   - Script will prompt for file location

2. **pg_dump Method:**
   - Get connection string from Supabase dashboard
   - Run pg_dump command
   - Script will prompt for file location

## Verification

After import, verify in target project:

```sql
-- Check tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check functions
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Why CLI Instead of MCP?

- ❌ No Supabase MCP server available
- ✅ Supabase CLI provides programmatic access
- ✅ Terminal commands can be automated
- ✅ Same result as MCP would provide

## Alternative: Direct SQL Export/Import

If CLI doesn't work, use the SQL-based export:

1. **Export:** Run `sql-queriers/export-complete-schema.sql` in source project SQL Editor
2. **Import:** Paste results into target project SQL Editor

This is the most reliable method and doesn't require CLI.

## Files

- `scripts/clone-schema-automated.sh` - Main automated script
- `CLONE_VIA_CLI.md` - This guide
- `sql-queriers/export-complete-schema.sql` - SQL queries for manual export
