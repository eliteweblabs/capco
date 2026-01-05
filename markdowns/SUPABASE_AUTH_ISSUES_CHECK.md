# Supabase Auth Issues - Railway Logs Check

## Summary

You're correct - the main CAPCO app uses **Supabase** for authentication, not Railway Postgres. The Postgres auth errors I found were from the **Cal.com service** (which uses Railway Postgres), not your main app.

## What to Check for Supabase Auth Issues

### 1. Environment Variables
Check that these are set in Railway for your main app service:

- `PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `PUBLIC_SUPABASE_PUBLISHABLE` - Your Supabase publishable/anonymous key
- `SUPABASE_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations (if used)

### 2. Common Supabase Auth Errors to Look For

**In Railway logs, search for:**
- `Supabase is not configured`
- `[---SUPABASE-CLIENT] Supabase not configured`
- `Authentication failed`
- `Invalid API key`
- `JWT expired` or `JWT invalid`
- `Session expired`
- `401` or `403` errors with Supabase
- `PGRST116` (profile not found)
- `Multiple GoTrueClient instances`

### 3. How to Check Logs

**For the main CAPCO app service:**
```bash
# Link to CAPCO project first
railway link --project 7defe707-81a1-48a5-8844-c2672ddcf294

# Link to capco service
railway service link capco

# Check logs for Supabase/auth issues
railway logs --service capco --lines 500 | grep -i "supabase\|auth"
```

**Or check in Railway Dashboard:**
1. Go to CAPCO Design Group project
2. Select "capco" service
3. View deployment logs
4. Search for: `supabase`, `auth`, `401`, `403`

### 4. Common Issues

**Missing Environment Variables:**
- If `PUBLIC_SUPABASE_URL` or `PUBLIC_SUPABASE_PUBLISHABLE` are missing, you'll see: `[---SUPABASE-CLIENT] Supabase not configured`

**Invalid Keys:**
- Wrong Supabase URL or key will cause authentication failures
- Check that keys match your Supabase project

**Session/Token Issues:**
- Expired tokens cause 401 errors
- Invalid refresh tokens cause auth failures
- Cookie issues can prevent authentication

**RLS (Row Level Security) Issues:**
- Policies might block access even with valid auth
- Check Supabase dashboard for RLS policies

## Note About Cal.com Errors

The Postgres authentication errors are from the **Cal.com service** (separate from your main app):
- Cal.com uses Railway Postgres, not Supabase
- These errors won't affect your main CAPCO app
- To fix Cal.com: Update `DATABASE_URL` to match current Postgres service credentials

## Next Steps

1. **Check main app logs** for Supabase-specific errors
2. **Verify environment variables** are set correctly
3. **Check Supabase dashboard** for any service issues
4. **Test authentication** in the app to see specific error messages

Would you like me to help check the Railway variables for the main app service, or help diagnose specific Supabase auth errors you're seeing?

