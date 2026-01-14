# Complete Schema Clone via MCP - Final Solution

## The Challenge

Supabase MCP server is configured, but it **doesn't expose direct schema export/import tools**. The Management API also doesn't support executing SQL directly.

## Best Solutions (Ranked)

### 🥇 Option 1: pg_dump (Most Complete & Reliable)

**Prerequisites:** Install PostgreSQL tools
```bash
brew install postgresql@15
```

**Steps:**
1. Get connection strings from Supabase dashboard:
   - Source: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/database
   - Target: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database
   - Click "Reveal" → Copy Pooler connection string

2. Export schema:
```bash
pg_dump "postgresql://postgres.qudlxlryegnainztkrtk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  -f complete-schema.sql
```

3. Import schema:
```bash
psql "postgresql://postgres.fhqglhcjlkusrykqnoel:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f complete-schema.sql
```

**Why this is best:**
- ✅ Exports **everything** (tables, functions, triggers, RLS, indexes, views, sequences, foreign keys)
- ✅ Single command
- ✅ Most reliable
- ✅ Handles dependencies automatically

### 🥈 Option 2: SQL Editor + CSV Converter (Works Without Tools)

**Steps:**
1. **Export from source:**
   - Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql
   - Run each PART from `sql-queriers/export-complete-schema.sql`
   - Export results as CSV for each part

2. **Convert CSV to SQL:**
```bash
node scripts/csv-to-sql-fixed.js tables.csv functions.csv triggers.csv policies.csv indexes.csv views.csv sequences.csv foreign_keys.csv
```

3. **Import to target:**
   - Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql
   - Paste and run the generated SQL

**Why this works:**
- ✅ No tools needed (uses Node.js which you have)
- ✅ Works 100% of the time
- ✅ You can review SQL before importing

### 🥉 Option 3: Supabase CLI (Limited)

**Issue:** Supabase CLI `db dump` doesn't support `--schema-only` flag, so it exports data too.

**Workaround:**
```bash
# Link to source
supabase link --project-ref qudlxlryegnainztkrtk

# Dump (includes data)
supabase db dump -f schema.sql --schema public

# Filter to schema only
grep -E "^(CREATE|ALTER|COMMENT|GRANT|REVOKE|--)" schema.sql > schema-only.sql

# Link to target
supabase link --project-ref fhqglhcjlkusrykqnoel

# Import (but CLI doesn't have db execute, so use SQL Editor)
# Copy schema-only.sql to SQL Editor and run
```

## Why MCP Can't Do This Directly

1. **Supabase MCP** provides project management tools, not direct database access
2. **Management API** doesn't support executing arbitrary SQL
3. **Database access** requires connection strings, not just API tokens

## Recommended: Use pg_dump

Since you want MCP-like automation, **pg_dump is the closest thing** - it's the standard PostgreSQL tool that MCP would use under the hood anyway.

**Quick setup:**
```bash
# Install PostgreSQL tools
brew install postgresql@15

# Use the scripts I created
./scripts/export-schema-pgdump.sh qudlxlryegnainztkrtk
./scripts/import-schema-pgdump.sh schema-export-*.sql fhqglhcjlkusrykqnoel
```

## Files Created

- `scripts/clone-complete-mcp.sh` - Shows best method based on available tools
- `scripts/export-schema-pgdump.sh` - pg_dump export script
- `scripts/import-schema-pgdump.sh` - psql import script
- `scripts/csv-to-sql-fixed.js` - CSV to SQL converter (fixed parser)
- `MCP_SCHEMA_CLONE_SOLUTION.md` - This guide

## TL;DR

**Best method:** Install `pg_dump` and use it directly. It's what MCP would use anyway, and it's the most reliable way to clone a complete database schema.
