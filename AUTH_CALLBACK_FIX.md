# Auth Callback Fix Guide

## Issues

1. **Missing PUBLIC\_ environment variables** - Client-side code needs `PUBLIC_` prefixed variables
2. **Missing redirect URL in Supabase** - OAuth requires the callback URL to be registered

## Solution

### Step 1: Add PUBLIC\_ Environment Variables to Railway

**For Production (Railway):**

1. Go to your Railway Dashboard
2. Select your project (capco-fire-protection or similar)
3. Click on the **Variables** tab
4. Add these two new environment variables:

```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Use the **exact same values** as your existing `PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` variables - just copy them:

- If `PUBLIC_SUPABASE_URL` = `https://qudlxlryegnainztkrtk.supabase.co`
- Then set `PUBLIC_SUPABASE_URL` = `https://qudlxlryegnainztkrtk.supabase.co` (same value)

- If `SUPABASE_ANON_KEY` = `eyJhbGc...` (long string)
- Then set `PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGc...` (same value)

5. Click **Save** or **Deploy** - Railway will automatically redeploy with the new variables

**Note:** These `PUBLIC_` prefixed variables are required for client-side code (browser) to access Supabase. The regular `PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` are only available server-side.

### Step 2: Re-add Redirect URL in Supabase (Production)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://capcofire.com/auth/callback
   ```
5. Click **Save**

**Important:** If you deleted this URL, Supabase will reject OAuth callbacks. This is a security feature - only registered URLs are allowed.

### Step 3: Verify Site URL

In the same **URL Configuration** section, ensure **Site URL** is set to:

```
https://capcofire.com
```

(Or your production domain)

### Step 4: Redeploy on Railway

After adding the environment variables in Railway:

1. Railway should automatically detect the changes and redeploy
2. Or manually trigger a redeploy from the Railway dashboard
3. Wait for the deployment to complete (usually 2-5 minutes)

### Step 5: Clear Browser Cache

After the redeploy:

1. Clear your browser cache/cookies for capcofire.com
2. Or use an incognito/private window
3. Try logging in again

## Why This Happened

- **Client-side code** (like the callback handler) runs in the browser and can only access environment variables prefixed with `PUBLIC_` in Astro
- **Supabase OAuth** validates redirect URLs for security - if the URL isn't registered, the callback will fail
- When you deleted the redirect URL permission, Supabase started rejecting callbacks to that URL

## Testing

After fixing:

1. Clear your browser cache/cookies for capcofire.com
2. Try logging in again
3. The callback should now work with the redirect URL registered
