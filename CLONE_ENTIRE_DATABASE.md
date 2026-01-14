# Clone Entire Database Schema Between Supabase Projects

This guide shows you how to export the **COMPLETE** database schema (all tables, functions, triggers, RLS policies, indexes, views, sequences) from one Supabase project and import it to another.

## Projects

- **Source:** `qudlxlryegnainztkrtk` (https://qudlxlryegnainztkrtk.supabase.co)
- **Target:** `fhqglhcjlkusrykqnoel` (https://fhqglhcjlkusrykqnoel.supabase.co)

## Quick Start (Automated)

```bash
# Clone entire schema from source to target
./scripts/clone-entire-database.sh qudlxlryegnainztkrtk fhqglhcjlkusrykqnoel
```

This will:
1. ✅ Export complete schema from source project
2. ✅ Import to target project
3. ✅ Handle linking/unlinking automatically

## What Gets Cloned

The complete database schema including:

### ✅ Database Objects
- **All Tables** - Complete table structures with columns, types, constraints, defaults
- **All Functions** - PostgreSQL functions and procedures
- **All Triggers** - Database triggers
- **All RLS Policies** - Row Level Security policies
- **All Indexes** - Database indexes
- **All Views** - Database views
- **All Sequences** - Auto-increment sequences
- **All Foreign Keys** - Foreign key constraints
- **All Constraints** - Primary keys, unique constraints, check constraints

### ❌ What Does NOT Get Cloned
- **Data (rows)** - Only structure, not data
- **Storage buckets** - Only database schema
- **Auth users** - Only public schema
- **Storage files** - Only database references

## Method 1: Automated Script (Recommended)

### Prerequisites

1. **Supabase CLI installed** ✓ (already installed)
2. **Logged into Supabase:**
   ```bash
   supabase login
   ```

### Run Clone Script

```bash
chmod +x scripts/clone-entire-database.sh
./scripts/clone-entire-database.sh
```

The script will:
- Link to source project
- Export complete schema
- Link to target project
- Import schema
- Show progress and handle errors

## Method 2: Using pg_dump (Most Reliable)

If you have PostgreSQL tools installed:

### Step 1: Install PostgreSQL Tools

```bash
brew install postgresql@15
```

### Step 2: Get Connection Strings

**Source Project:**
1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk
2. Settings → Database → Connection string
3. Click "Reveal" next to **Pooler** connection string
4. Copy the full connection string

**Target Project:**
1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel
2. Settings → Database → Connection string
3. Click "Reveal" next to **Pooler** connection string
4. Copy the full connection string

### Step 3: Export Schema

```bash
# Replace [PASSWORD] with actual password from connection string
pg_dump "postgresql://postgres.qudlxlryegnainztkrtk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  -f complete-schema-export.sql
```

### Step 4: Import Schema

```bash
# Replace [PASSWORD] with actual password from connection string
psql "postgresql://postgres.fhqglhcjlkusrykqnoel:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f complete-schema-export.sql
```

## Method 3: Using Supabase Dashboard (SQL Editor)

If CLI/pg_dump don't work, use the SQL Editor:

### Step 1: Export from Source

1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk
2. Open **SQL Editor** → **New query**
3. Run the queries from `sql-queriers/export-complete-schema.sql`
4. Copy **all** the CREATE statements from results
5. Save to a file (e.g., `schema-export.sql`)

The export script generates:
- CREATE TABLE statements
- CREATE FUNCTION statements
- CREATE TRIGGER statements
- CREATE POLICY statements (RLS)
- CREATE INDEX statements
- CREATE VIEW statements
- CREATE SEQUENCE statements
- ALTER TABLE statements (foreign keys)

### Step 2: Import to Target

1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel
2. Open **SQL Editor** → **New query**
3. Paste all CREATE statements from Step 1
4. Click **Run** (Cmd/Ctrl + Enter)
5. Review output for any errors

**Note:** Some "already exists" errors are normal and can be ignored.

## Verification

After importing, verify in target project:

```sql
-- Check tables
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check functions
SELECT COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public';

-- Check triggers
SELECT COUNT(*) as trigger_count
FROM pg_trigger
WHERE NOT tgisinternal;

-- Check RLS policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public';

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- List all functions
SELECT p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;
```

## Troubleshooting

### Error: "relation already exists"

**Normal!** The scripts use `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION` to handle existing objects. These warnings can be ignored.

### Error: "function already exists"

Some functions may need `CREATE OR REPLACE` instead of `CREATE`. The export script should handle this, but if you see errors, manually replace `CREATE FUNCTION` with `CREATE OR REPLACE FUNCTION`.

### Error: "permission denied"

- Make sure you're using the **Pooler** connection string (port 6543), not Direct (port 5432)
- Verify credentials are correct
- Check that you have admin access to both projects

### Error: "could not connect to server"

- Check internet connection
- Verify connection string format
- Make sure you're using port **6543** (Pooler)
- Try the connection string in a PostgreSQL client to test

### Import hangs or is slow

- Large schemas can take 5-15 minutes
- This is normal for databases with many functions/triggers
- Be patient and let it complete

### Some functions fail to import

Functions may have dependencies. Import order matters:
1. Tables first
2. Functions (may need multiple passes)
3. Triggers
4. Policies

Or run the import script multiple times - dependencies will resolve on subsequent runs.

### Missing extensions

If you see errors about missing extensions (like `pgcrypto`, `uuid-ossp`), enable them in target project:

```sql
-- Enable common extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Expected Import Output

A successful import will show:
- ✅ CREATE TABLE statements (some "already exists" warnings are OK)
- ✅ CREATE FUNCTION statements
- ✅ CREATE TRIGGER statements
- ✅ CREATE POLICY statements
- ✅ CREATE INDEX statements

Errors that are **OK to ignore**:
- `relation "X" already exists`
- `function "X" already exists`
- `index "X" already exists`

## Files Created

- `scripts/clone-entire-database.sh` - Main automated clone script
- `scripts/export-schema-pgdump.sh` - pg_dump export script
- `scripts/import-schema-pgdump.sh` - psql import script
- `sql-queriers/export-complete-schema.sql` - SQL queries for manual export
- `CLONE_ENTIRE_DATABASE.md` - This guide

## Next Steps

After successful clone:

1. ✅ Verify all tables exist in target project
2. ✅ Check that functions are working
3. ✅ Verify RLS policies are active
4. ✅ Test your application
5. ✅ Check that triggers are firing correctly

## Security Notes

- The schema export does **NOT** include data (rows)
- User authentication data is **NOT** exported
- Only the database structure is cloned
- You'll need to set up auth users separately in target project

## Need Help?

If you're stuck:
1. Check the import log file for specific errors
2. Try importing in smaller chunks (tables first, then functions)
3. Use the SQL Editor method for more control
4. Verify connection strings are correct
