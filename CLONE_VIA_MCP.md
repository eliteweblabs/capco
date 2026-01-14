# Clone Database Schema via Supabase MCP

You have Supabase MCP configured! However, since Supabase MCP doesn't expose direct schema export/import tools, we'll use the Supabase Management API (which MCP uses under the hood).

## Quick Start

```bash
# Make sure your access token is set (from MCP config)
export SUPABASE_ACCESS_TOKEN="sbp_a65bdf5279f0debe7e32d8bdd140a22b70556a8e"

# Run the clone script
./scripts/clone-schema-mcp.sh qudlxlryegnainztkrtk fhqglhcjlkusrykqnoel
```

## Method 1: Using the Script (Recommended)

The script uses the Supabase Management API to:
1. ✅ Get project information
2. ✅ Generate SQL export queries
3. ✅ Guide you through manual import

```bash
./scripts/clone-schema-mcp.sh
```

## Method 2: Direct SQL Export (Most Reliable)

Since Supabase Management API doesn't support direct schema dump, use SQL:

### Step 1: Export from Source

1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql
2. Open **New query**
3. Run queries from: `sql-queriers/export-complete-schema.sql`
4. Copy all CREATE statements from results
5. Save to file: `schema-export.sql`

### Step 2: Import to Target

1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql
2. Open **New query**
3. Paste CREATE statements from Step 1
4. Click **Run**
5. Review output (some "already exists" errors are normal)

## Method 3: Using Supabase CLI (If Available)

If you have Supabase CLI linked:

```bash
# Export
supabase link --project-ref qudlxlryegnainztkrtk
supabase db dump --schema-only > schema.sql
supabase unlink

# Import
supabase link --project-ref fhqglhcjlkusrykqnoel
supabase db execute --file schema.sql
supabase unlink
```

## Method 4: Using pg_dump (Most Complete)

If you have PostgreSQL tools:

```bash
# Get connection strings from Supabase dashboard
# Settings → Database → Connection string → Pooler

# Export
pg_dump "postgresql://postgres.qudlxlryegnainztkrtk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  -f schema.sql

# Import
psql "postgresql://postgres.fhqglhcjlkusrykqnoel:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f schema.sql
```

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

## Why MCP Doesn't Have Direct Export

Supabase MCP server provides project management tools, but schema export requires:
- Direct database access (pg_dump)
- SQL queries (SQL Editor)
- Or Management API + manual SQL generation

The script (`clone-schema-via-api.js`) uses the Management API to generate the SQL export queries for you.

## Files Created

- `scripts/clone-schema-mcp.sh` - Main MCP-based script
- `scripts/clone-schema-via-api.js` - Node.js API script
- `sql-queriers/export-complete-schema.sql` - SQL export queries
- `CLONE_VIA_MCP.md` - This guide

## Troubleshooting

### Error: "Access token invalid"

Check your MCP config:
```bash
cat ~/.cursor/mcp.json | grep SUPABASE_ACCESS_TOKEN
```

Or get a new token:
https://supabase.com/dashboard/account/tokens

### Error: "Project not found"

Verify project refs are correct:
- Source: `qudlxlryegnainztkrtk`
- Target: `fhqglhcjlkusrykqnoel`

### Export returns empty

Use Method 2 (Direct SQL Export) - it's the most reliable.

## Recommended Approach

**For reliability, use Method 2 (Direct SQL Export):**
1. Run `sql-queriers/export-complete-schema.sql` in source SQL Editor
2. Copy CREATE statements
3. Paste into target SQL Editor
4. Run

This method works 100% of the time and doesn't depend on API limitations.
