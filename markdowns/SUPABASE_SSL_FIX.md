# Fix Supabase SSL Connection Issue

## Problem

Supabase requires SSL/TLS encryption, but StudioCMS PostgreSQL driver doesn't include SSL configuration by default.

Error: `no pg_hba.conf entry for host ..., no encryption`

## Solution Options

### Option 1: Use Supabase Connection Pooling (Recommended)

Supabase connection pooling URLs include SSL by default. Get the connection pooling URL from:

1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/database
2. Click **"Connection pooling"** tab
3. Use the **"Session"** or **"Transaction"** mode connection string
4. It will look like: `postgresql://postgres.qudlxlryegnainztkrtk:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

This URL already includes SSL configuration.

### Option 2: Use Connection String with SSL

If StudioCMS supports connection strings, use:

```bash
CMS_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.qudlxlryegnainztkrtk.supabase.co:5432/postgres?sslmode=require
```

### Option 3: Modify StudioCMS Driver (Not Recommended)

We could modify the driver to add SSL, but this would be overwritten on updates.

## Recommended: Use Connection Pooling

1. Get connection pooling URL from Supabase dashboard
2. Extract the components:
   - Host: `aws-0-us-east-1.pooler.supabase.com`
   - Port: `6543` (or `5432` for direct)
   - User: `postgres.qudlxlryegnainztkrtk`
   - Password: [your password]
   - Database: `postgres`

3. Update `.env`:
```bash
CMS_PG_DATABASE=postgres
CMS_PG_USER=postgres.qudlxlryegnainztkrtk
CMS_PG_PASSWORD=[PASSWORD]
CMS_PG_HOST=aws-0-us-east-1.pooler.supabase.com
CMS_PG_PORT=6543
```

The connection pooling URL should handle SSL automatically.

