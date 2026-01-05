# Google OAuth "No authorization code received" Fix

## Problem

When clicking "Sign in with Google" on https://capcofire.com/auth/login, you get the error "No authorization code received". This happens because Google OAuth isn't properly configured to redirect back to your app.

## Root Cause

When using Supabase's `signInWithOAuth`, the OAuth flow works like this:

1. Your app calls `supabase.auth.signInWithOAuth()` with `redirectTo: https://capcofire.com/auth/callback`
2. Supabase generates an OAuth URL that tells Google to redirect to **Supabase's callback** first: `https://[project-id].supabase.co/auth/v1/callback`
3. Supabase processes the OAuth response and then redirects to your app: `https://capcofire.com/auth/callback`

**The issue**: Google Cloud Console needs to have the **Supabase callback URL** registered, not your app's callback URL.

## Solution

### Step 1: Find Your Supabase Project ID

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy your **Project URL** (e.g., `https://qudlxlryegnainztkrtk.supabase.co`)
5. Extract the project ID (the part before `.supabase.co`)

Your Supabase callback URL will be: `https://[project-id].supabase.co/auth/v1/callback`

### Step 2: Add Supabase Callback URL to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one configured in Supabase)
5. Click on it to edit
6. In the **Authorized redirect URIs** section, click **+ ADD URI**
7. Add your Supabase callback URL:
   ```
   https://[your-project-id].supabase.co/auth/v1/callback
   ```
   For example: `https://qudlxlryegnainztkrtk.supabase.co/auth/v1/callback`
8. Click **Save**

**Important**: 
- Must be **exact match** (including `/auth/v1/callback` path)
- Must include `https://` protocol
- No trailing slash
- Case-sensitive

### Step 3: Verify Supabase Redirect URL Configuration

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, ensure you have:
   ```
   https://capcofire.com/auth/callback
   ```
4. If missing, click **Add URL** and add it
5. Click **Save**

### Step 4: Verify Site URL

In the same **URL Configuration** section, ensure **Site URL** is set to:
```
https://capcofire.com
```

### Step 5: Wait for Changes to Propagate

- Google Cloud Console changes can take 1-2 minutes to propagate
- Supabase changes are usually immediate

### Step 6: Test the Fix

1. Clear your browser cache/cookies for capcofire.com
2. Or use an incognito/private window
3. Go to https://capcofire.com/auth/login
4. Click "Sign in with Google"
5. Complete the Google sign-in
6. You should be redirected back to your app successfully

## Additional Debugging

If it still doesn't work, check the browser console (F12) for:

1. **OAuth URL**: Look for `[GOOGLE-SIGNIN] Redirect URL:` in console logs
2. **Callback URL**: Look for `[AUTH-CALLBACK] Full URL:` in console logs
3. **Error messages**: Check for any OAuth-related errors

The callback page now logs detailed information about:
- Full URL
- Search parameters
- Hash fragments
- All extracted parameters

## Common Mistakes

❌ **Only adding your app's callback URL** - Google needs Supabase's callback URL
❌ **Wrong path** - Must be `/auth/v1/callback` (not `/auth/callback`)
❌ **HTTP vs HTTPS** - Production must use `https://`
❌ **Trailing slash** - No trailing slash allowed
❌ **Wrong project ID** - Must match your actual Supabase project ID

✅ **Add Supabase callback URL** - `https://[project-id].supabase.co/auth/v1/callback`
✅ **Also add your app callback in Supabase** - `https://capcofire.com/auth/callback`
✅ **No trailing slash** - Exact match required
✅ **HTTPS for production** - Required for security

## Why This Happens

Supabase acts as an OAuth proxy:
- Google redirects to Supabase first (for security and token management)
- Supabase then redirects to your app (with session tokens)
- This requires Google to trust Supabase's callback URL
- Your app's callback URL only needs to be registered in Supabase (not Google)

## Verification Checklist

- [ ] Supabase callback URL added to Google Cloud Console
- [ ] App callback URL added to Supabase Dashboard
- [ ] Site URL set correctly in Supabase
- [ ] Changes propagated (waited 1-2 minutes)
- [ ] Browser cache cleared
- [ ] Tested in incognito/private window

