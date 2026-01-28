# Pull Database from Production Supabase

## Prerequisites

- Local Supabase running (`supabase start`)
- Production Supabase is online
- Supabase CLI installed

## Step 1: Get Your Project Reference ID

Your project ref is in your production URL:

```
https://qudlxlryegnainztkrtk.supabase.co
         ^^^^^^^^^^^^^^^^^^^^
         This is your project ref
```

From your `.env`: `qudlxlryegnainztkrtk`

## Step 2: Link to Production Project

```bash
cd /Users/4rgd/Astro/astro-supabase-main
supabase link --project-ref qudlxlryegnainztkrtk
```

This will prompt you for your Supabase password (the one you use to log into supabase.com dashboard).

## Step 3: Pull Schema Only (Fast, Recommended)

This pulls your table structure, RLS policies, functions, triggers, etc. **No data**.

```bash
supabase db pull
```

This creates migration files in `supabase/migrations/` with your schema.

## Step 4: Apply Schema to Local Database

```bash
supabase db reset
```

This will:

- Drop your local database
- Recreate it from scratch
- Apply all migrations

Your local database now has the same schema as production! 🎉

## Option B: Pull Schema + Data (Slower)

If you also need production data locally:

### Method 1: Using pg_dump (Best for full copy)

```bash
# Get production database URL from Supabase dashboard > Project Settings > Database
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.qudlxlryegnainztkrtk.supabase.co:5432/postgres

# Dump production database
pg_dump "postgresql://postgres:padHec-6javje-kygxam@db.qudlxlryegnainztkrtk.supabase.co:5432/postgres" \
  --no-owner \
  --no-acl \
  -f production_dump.sql

# Restore to local database
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f production_dump.sql
```

### Method 2: Using Supabase CLI (Selective Tables)

```bash
# Export specific tables
supabase db dump --data-only -f seed.sql

# Or export specific tables
supabase db dump --data-only --table projects --table profiles -f seed.sql

# Place in supabase/seed.sql and run:
supabase db reset
```

## Verify Local Database

```bash
# Check tables exist
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "\dt"

# Check data (if you imported it)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "SELECT COUNT(*) FROM projects;"
```

## Update .env for Local Development

```bash
# Comment out production URLs
# PUBLIC_SUPABASE_URL=https://qudlxlryegnainztkrtk.supabase.co
# PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Add local URLs (from `supabase status`)
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... # from supabase status
SUPABASE_SECRET=... # from supabase status
```

## Switch Back to Production

When Supabase is back online:

```bash
# Just restore original .env values
PUBLIC_SUPABASE_URL=https://qudlxlryegnainztkrtk.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Keeping Local & Production in Sync

### Pull latest schema changes:

```bash
supabase db pull
supabase db reset
```

### Push local changes to production:

```bash
supabase db push
```

**⚠️ Warning**: `db push` modifies production! Only use after testing locally.

## Troubleshooting

### "Failed to link project"

- Check your Supabase dashboard password
- Make sure project ref is correct: `qudlxlryegnainztkrtk`

### "pg_dump: command not found"

```bash
# macOS
brew install postgresql

# Or use Docker
docker run --rm postgres:15 pg_dump ...
```

### Local database has no tables after reset

- Make sure you ran `supabase db pull` first
- Check `supabase/migrations/` folder has SQL files
- Run `supabase db reset` again

### Production connection refused

- Supabase is still down
- Check your database password
- Verify connection string in Supabase dashboard

## Quick Reference

```bash
# Full workflow
supabase start                                  # Start local
supabase link --project-ref qudlxlryegnainztkrtk  # Link to prod
supabase db pull                                # Pull schema
supabase db reset                               # Apply locally
supabase status                                 # Get local keys

# Update .env with local URLs/keys
# Restart dev server
```

---

**Current Status**: Waiting for production Supabase to come back online  
**Next Step**: Run `supabase link` when Supabase is accessible
