# Quick Schema Clone Guide

## ✅ PostgreSQL Tools Found!

Your `pg_dump` is at: `/opt/homebrew/opt/postgresql@15/bin/pg_dump`

## Quick Start

### Step 1: Add PostgreSQL to PATH (One-time setup)

```bash
# Add to your shell config
echo 'export PATH="$(brew --prefix postgresql@15)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Or run this helper script
./scripts/setup-pg-path.sh
```

### Step 2: Get Connection Strings

**Source Project:**
1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/database
2. Click "Reveal" next to **Pooler** connection string
3. Copy the entire connection string (includes password)

**Target Project:**
1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database
2. Click "Reveal" next to **Pooler** connection string
3. Copy the entire connection string

### Step 3: Export Schema

```bash
# Make sure PostgreSQL is in PATH
export PATH="$(brew --prefix postgresql@15)/bin:$PATH"

# Run export script
./scripts/export-schema-pgdump.sh qudlxlryegnainztkrtk
# When prompted, paste the SOURCE connection string
```

### Step 4: Import Schema

```bash
# Run import script
./scripts/import-schema-pgdump.sh schema-export-*.sql fhqglhcjlkusrykqnoel
# When prompted, paste the TARGET connection string
# Type "yes" to confirm
```

## One-Liner (After PATH Setup)

```bash
# Export
./scripts/export-schema-pgdump.sh qudlxlryegnainztkrtk

# Import (after export completes)
./scripts/import-schema-pgdump.sh schema-export-*.sql fhqglhcjlkusrykqnoel
```

## What Gets Cloned

✅ **Complete schema:**
- All tables
- All functions
- All triggers
- All RLS policies
- All indexes
- All views
- All sequences
- All foreign keys
- All constraints

## Troubleshooting

### "pg_dump not found"

Run:
```bash
export PATH="$(brew --prefix postgresql@15)/bin:$PATH"
```

### "password authentication failed"

- Make sure you copied the **entire** connection string
- Use the **Pooler** connection string (port 6543), not Direct
- Check for extra spaces or quotes

### Import errors

Some "already exists" errors are normal and can be ignored. The script uses `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION`.

## Files Created

- `scripts/export-schema-pgdump.sh` - Export script (now finds pg_dump automatically)
- `scripts/import-schema-pgdump.sh` - Import script (now finds psql automatically)
- `scripts/setup-pg-path.sh` - Helper to add PostgreSQL to PATH
- `QUICK_CLONE_GUIDE.md` - This guide
