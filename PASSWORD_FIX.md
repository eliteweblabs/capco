# Password Authentication Fix

## Status

✅ **SSL is working** - No more "no encryption" error  
❌ **Password authentication failed** - Password in `.env` doesn't match

## Solution

The password in your `.env` file (`vutHyw-sicvy6-ziwveg`) doesn't match the actual database password.

### Option 1: Reset Password via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/database
2. Scroll to **"Database Password"** section
3. Click **"Reset Database Password"**
4. Copy the new password immediately
5. Update `.env`:
   ```bash
   CMS_PG_PASSWORD=[NEW-PASSWORD]
   ```

### Option 2: Use Connection Pooling (Alternative)

Connection pooling uses a different authentication method:

1. Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/database
2. Click **"Connection pooling"** tab
3. Copy the **"Session"** mode connection string
4. Extract values:
   - User: `postgres.qudlxlryegnainztkrtk` (note the format)
   - Host: `aws-0-us-east-1.pooler.supabase.com`
   - Port: `6543`
   - Password: [from connection string]

5. Update `.env`:
   ```bash
   CMS_PG_USER=postgres.qudlxlryegnainztkrtk
   CMS_PG_HOST=aws-0-us-east-1.pooler.supabase.com
   CMS_PG_PORT=6543
   CMS_PG_PASSWORD=[PASSWORD-FROM-POOLING-URL]
   ```

## After Fixing Password

Run migrations:
```bash
npx studiocms migrate --latest
```

