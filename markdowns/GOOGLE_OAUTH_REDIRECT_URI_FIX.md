# Google OAuth Redirect URI Configuration Fix

## Problem

Google OAuth requires the redirect URI to be registered in **OAuth Client Credentials**, not just in Authorized Domains.

## Two Different Places in Google Cloud Console

### 1. Authorized Domains (Consent Screen)
- **Location**: APIs & Services → OAuth consent screen → Authorized domains
- **Purpose**: Domains allowed on the consent screen
- **What you have**: ✅ `capcofire.com` and `qudlxlryegnainztkrtk.supabase.co`

### 2. Authorized Redirect URIs (OAuth Client)
- **Location**: APIs & Services → Credentials → Your OAuth 2.0 Client ID → Authorized redirect URIs
- **Purpose**: Exact URLs that Google can redirect to after authentication
- **What you need**: The exact redirect URL that your app uses

## Required Redirect URIs

Based on your code, you need to add these **exact URLs** in the OAuth Client Credentials:

### Production (Required)
```
https://capcofire.com/api/auth/callback
```

### Development (Optional but recommended)
```
http://localhost:4321/api/auth/callback
```

### Supabase Domain (If Supabase handles OAuth)
```
https://qudlxlryegnainztkrtk.supabase.co/auth/v1/callback
```

## How to Fix

### Step 1: Find Your OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your **OAuth 2.0 Client ID** (the one used by Supabase or your app)
4. Click on it to edit

### Step 2: Add Authorized Redirect URIs

In the **Authorized redirect URIs** section, click **+ ADD URI** and add:

```
https://capcofire.com/api/auth/callback
```

**Important**: 
- Must be **exact match** (including `/api/auth/callback` path)
- Must include `https://` protocol
- No trailing slash
- Case-sensitive

### Step 3: Verify Supabase Configuration

In **Supabase Dashboard** → **Authentication** → **Providers** → **Google**:

Make sure the **Redirect URL** is set to:
```
https://capcofire.com/api/auth/callback
```

### Step 4: Check Railway Logs

After making changes, try OAuth again and check Railway logs for:
```
[---AUTH-SIGNIN] OAuth redirect URL: https://capcofire.com/api/auth/callback
```

This should match what you configured in Google Cloud Console.

## Common Mistakes

❌ **Only adding domain** - Google needs the full URL path
❌ **Wrong path** - Must be `/api/auth/callback` (not `/auth/callback`)
❌ **HTTP vs HTTPS** - Production must use `https://`
❌ **Trailing slash** - No trailing slash allowed

✅ **Full URL with path** - `https://capcofire.com/api/auth/callback`
✅ **No trailing slash** - Exact match required
✅ **HTTPS for production** - Required for security

## Verification

After adding the redirect URI:

1. Save in Google Cloud Console
2. Wait 1-2 minutes for changes to propagate
3. Try Google OAuth again
4. Check Railway logs for `[---AUTH-SIGNIN]` messages
5. Should see successful redirect

