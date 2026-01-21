# Clone Supabase Schema Between Projects

This guide shows you how to export the complete database schema (tables, functions, triggers, RLS policies, etc.) from one Supabase project and import it to another.

## Projects

- **Source:** `qudlxlryegnainztkrtk` (https://qudlxlryegnainztkrtk.supabase.co)
- **Target:** `fhqglhcjlkusrykqnoel` (https://fhqglhcjlkusrykqnoel.supabase.co)

## Method 1: Automated Script (Recommended)

### Prerequisites

1. **Supabase CLI installed** (already installed ✓)
2. **Logged into Supabase CLI:**
   ```bash
   supabase login
   ```

### Run the Clone Script

```bash
./scripts/clone-supabase-schema.sh
```

This script will:
1. Link to source project
2. Export complete schema
3. Link to target project  
4. Import schema
5. Clean up

**Note:** The script may prompt for project linking if not already linked.

## Method 2: Manual Export/Import

### Step 1: Export from Source

```bash
# Export schema from source project
./scripts/export-supabase-schema.sh qudlxlryegnainztkrtk schema-export.sql
```

This creates `schema-export.sql` with the complete schema.

### Step 2: Import to Target

```bash
# Import schema to target project
./scripts/import-supabase-schema.sh schema-export.sql fhqglhcjlkusrykqnoel
```

## Method 3: Using Supabase Dashboard (SQL Editor)

If CLI doesn't work, use the SQL Editor:

### Step 1: Export from Source Project

1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk
2. Open **SQL Editor**
3. Run the queries from `sql-queriers/export-complete-schema.sql`
4. Copy all the CREATE statements from the results
5. Save to a file (e.g., `schema-export.sql`)

### Step 2: Import to Target Project

1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel
2. Open **SQL Editor**
3. Paste the CREATE statements from Step 1
4. Click **Run** (or Cmd/Ctrl + Enter)
5. Review any errors (some may be expected if things already exist)

## Method 4: Using pg_dump (Most Reliable)

If you have PostgreSQL tools installed:

### Step 1: Get Connection Strings

**Source Project:**
1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk
2. Settings → Database → Connection string
3. Copy the **Pooler** connection string (port 6543)

**Target Project:**
1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel
2. Settings → Database → Connection string
3. Copy the **Pooler** connection string (port 6543)

### Step 2: Export Schema

```bash
# Replace with your actual connection string
pg_dump "postgresql://postgres.qudlxlryegnainztkrtk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  -f schema-export.sql
```

### Step 3: Import Schema

```bash
# Replace with your actual connection string
psql "postgresql://postgres.fhqglhcjlkusrykqnoel:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f schema-export.sql
```

## What Gets Exported

The schema export includes:

✅ **Tables** - All table structures with columns, types, constraints
✅ **Functions** - All PostgreSQL functions and procedures
✅ **Triggers** - All database triggers
✅ **RLS Policies** - All Row Level Security policies
✅ **Indexes** - All database indexes
✅ **Views** - All database views
✅ **Sequences** - All sequences (for auto-increment columns)
✅ **Foreign Keys** - All foreign key constraints

**Does NOT include:**
❌ Data (rows) - Only structure
❌ Storage buckets - Only database schema
❌ Auth users - Only public schema

## Troubleshooting

### Error: "relation already exists"

This is normal! The scripts use `CREATE TABLE IF NOT EXISTS` to handle existing tables. You can safely ignore these warnings.

### Error: "function already exists"

Use `CREATE OR REPLACE FUNCTION` instead. The export script should handle this, but if you see errors, you can manually replace `CREATE FUNCTION` with `CREATE OR REPLACE FUNCTION`.

### Error: "permission denied"

Make sure you're using the correct connection string with proper credentials. Use the **Pooler** connection string, not Direct.

### Error: "could not connect to server"

- Check your internet connection
- Verify the connection string is correct
- Make sure you're using port **6543** (Pooler), not 5432

### Some functions fail to import

Some functions may depend on extensions or other functions. Import them in order:
1. Tables first
2. Functions
3. Triggers
4. Policies

Or run the export script multiple times - dependencies will resolve.

## Verification

After importing, verify in target project:

```sql
-- Check tables exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check functions exist
SELECT COUNT(*) FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

## Next Steps

After successful schema clone:

1. ✅ Verify notifications table exists
2. ✅ Test your application
3. ✅ Check that functions work correctly
4. ✅ Verify RLS policies are active

## Files Created

- `scripts/clone-supabase-schema.sh` - Automated clone script
- `scripts/export-supabase-schema.sh` - Export script
- `scripts/import-supabase-schema.sh` - Import script
- `sql-queriers/export-complete-schema.sql` - SQL queries for manual export
- `sql-queriers/sync-notifications-schema.sql` - Just notifications table sync
