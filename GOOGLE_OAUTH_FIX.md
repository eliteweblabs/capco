# Google OAuth "Supabase is not configured" Fix

## Problem

When clicking "Sign in with Google", you get "Supabase is not configured" error. This happens at **runtime** (not build time) when the server tries to create the OAuth redirect URL.

## Root Cause

The `/api/auth/signin` endpoint checks `if (!supabase)` at line 10. If `supabase` is null, it fails. The `supabase` client is created in `src/lib/supabase.ts` which runs server-side.

## Solution

### Step 1: Check Railway Logs

1. Go to Railway Dashboard
2. Select your project
3. Go to **Deployments** → Click latest deployment
4. Check the **Logs** tab
5. Look for `[SUPABASE-CLIENT]` messages

You should see either:

- ✅ `Supabase configured successfully` - Variables are working
- ❌ `Supabase not configured - missing environment variables` - Variables missing

### Step 2: Verify All Variables in Railway

In Railway **Variables** tab, ensure you have **ALL** of these:

```bash
# Required for server-side (OAuth redirect)
SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Required for client-side (callback handler)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Use the **same values** for both sets - they're just different names for different contexts.

### Step 3: Why Both Are Needed

- **Server-side** (`/api/auth/signin.ts`): Uses `SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to create OAuth redirect
- **Client-side** (`/auth/callback.astro`): Uses `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` to exchange code for session

The code has fallbacks, but Railway might not have both sets available.

### Step 4: Verify in Railway

1. In Railway Variables, check:
   - Do you see `SUPABASE_URL`? (not just `PUBLIC_SUPABASE_URL`)
   - Do you see `PUBLIC_SUPABASE_ANON_KEY`? (not just `PUBLIC_SUPABASE_ANON_KEY`)

2. If missing, add them:
   - Click **+ New Variable**
   - Add `SUPABASE_URL` = same value as `PUBLIC_SUPABASE_URL`
   - Add `PUBLIC_SUPABASE_ANON_KEY` = same value as `PUBLIC_SUPABASE_ANON_KEY`
   - Save

3. Railway will auto-redeploy

### Step 5: Test Again

After redeploy:

1. Try Google OAuth again
2. Check Railway logs for the `[SUPABASE-CLIENT]` message
3. Should see "✅ Supabase configured successfully"

## Debugging

If still not working, check:

1. **Railway Logs** - Look for the error message and env check
2. **Browser Console** - Check `/auth/callback` page for client-side env vars
3. **Network Tab** - Check if `/api/auth/signin` returns 500 error

## Quick Test

Add this temporarily to see what Railway has:

```bash
# In Railway, add a test variable
TEST_VAR=test_value
```

Then check Railway logs - if you see it, env vars are working. If not, there's a Railway configuration issue.
