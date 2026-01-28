# Local Supabase Setup Guide

## Prerequisites

1. **Docker Desktop** must be running
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon in menu bar should be steady)

## Start Local Supabase

```bash
cd /Users/4rgd/Astro/astro-supabase-main
supabase start
```

This will:

- Start PostgreSQL database on port **54322**
- Start Supabase Studio on port **54323** (http://127.0.0.1:54323)
- Start API server on port **54321**
- Takes ~2-3 minutes first time (downloads Docker images)

## Get Connection Details

```bash
supabase status
```

This shows:

- API URL: `http://127.0.0.1:54321`
- DB URL: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- Studio URL: `http://127.0.0.1:54323`
- anon key: (for client-side)
- service_role key: (for server-side)

## Update .env File

After starting, copy the keys from `supabase status` to your `.env`:

```env
# Local Supabase
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<anon_key_from_supabase_status>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_from_supabase_status>
```

## Migrate Your Schema

If you have migrations:

```bash
supabase db push
```

Or link to remote and pull schema:

```bash
supabase link --project-ref <your-project-ref>
supabase db pull
supabase db push
```

## Stop Local Supabase

```bash
supabase stop
```

## Access Studio

Open http://127.0.0.1:54323 in your browser to:

- View tables
- Run SQL queries
- Manage auth users
- View realtime subscriptions

## Troubleshooting

### Docker not running

```
Error: Cannot connect to Docker daemon
Fix: Open Docker Desktop and wait for it to start
```

### Ports already in use

```
Error: port 54321 already in use
Fix: supabase stop && supabase start
```

### Need to reset database

```bash
supabase db reset
```

## Switch Back to Production

Just update `.env` back to your production Supabase URLs and restart the dev server.

---

**Current Status**: Supabase cloud is down for maintenance  
**Solution**: Run local Supabase until cloud is back up
