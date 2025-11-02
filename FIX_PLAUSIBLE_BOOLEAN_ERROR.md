# 🔧 Quick Fix: Plausible Boolean Value Error

## 🚨 Error

```
Invalid boolean value: "". Expected one of: 1, 0, t, f, true, false, y, n, yes, no, on, off
```

## 🎯 **Common Problem Variables**

### Problem 1: `SMTP_HOST_SSL_ENABLED` (Boolean Error)

**Root Cause**: The `SMTP_HOST_SSL_ENABLED` environment variable is set to an empty string (`""`) when it should be `true` or `false`.

**Good News**: The configuration has been updated to use **Resend's SMTP** instead of a local mail service. For Resend SMTP on port 587, you should set this to `false`.

### Problem 2: `BASE_URL` (URL Format Error)

**Error**: `BASE_URL must start with http or https. Currently configured as plausible-analytics-ce.railway.internal`

**Root Cause**: `BASE_URL` is using `${{RAILWAY_PRIVATE_DOMAIN}}` instead of `${{RAILWAY_PUBLIC_DOMAIN}}`, or a public domain hasn't been generated.

**Fix**: 
1. Generate a public domain for your service (Railway Dashboard → Service → Settings → Networking → Generate Domain)
2. Verify `BASE_URL` uses `${{RAILWAY_PUBLIC_DOMAIN}}` (this is automatically set in `railway-plausible.json`)
3. If you manually override `BASE_URL`, make sure it's a full public URL starting with `https://`

## ✅ Immediate Fix Steps

### Step 1: Open Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your Plausible Analytics project
3. Go to the **Variables** tab

### Step 2: Find Empty Boolean Variables

Look through your environment variables and identify any that are:

- Set to an empty value `""`
- Commonly problematic boolean variables:
  - `ENABLE_EMAIL_VERIFICATION`
  - `DISABLE_REGISTRATION`
  - `DISABLE_SUBSCRIPTIONS`
  - `ENABLE_ACCOUNT_CREATION`
  - `DISABLE_SIGNUPS`
  - `ENABLE_INVITATIONS`
  - `SMTP_MX_LOOKUPS`
  - `SMTP_VERIFY`

### Step 3: Fix `SMTP_HOST_SSL_ENABLED` (If you see boolean error)

**Only do this if you see the boolean error!**

1. Find `SMTP_HOST_SSL_ENABLED` in your Railway variables
2. Click on it to edit
3. **Change the value from empty `""` to `false`**
   - You're using Resend SMTP on port 587 (TLS/STARTTLS), so set it to `false`
   - Port 587 uses STARTTLS (upgrades connection to TLS), not direct SSL
   - If using port 465 (direct SSL), you'd set it to `true`
4. Save the variable

**Why `false`?**

- Port 587 = STARTTLS (connection starts unencrypted, then upgrades to TLS) → `SMTP_HOST_SSL_ENABLED=false`
- Port 465 = Direct SSL/TLS (connection is encrypted from start) → `SMTP_HOST_SSL_ENABLED=true`
- The configuration now uses Resend's SMTP at `smtp.resend.com:587`, which requires `false`

### Step 3b: Fix `BASE_URL` (If you see URL format error)

**Only do this if you see the BASE_URL error!**

**Option 1: Generate Public Domain (Recommended)**
1. Go to Railway Dashboard → Your Project → Services → plausible
2. Click on the service → **Settings** tab → **Networking**
3. Click **Generate Domain** button
4. Railway will automatically set `RAILWAY_PUBLIC_DOMAIN` (used by `BASE_URL`)
5. Redeploy the service

**Option 2: Manually Set BASE_URL**
1. If you manually set `BASE_URL` variable, make sure it:
   - Uses `${{RAILWAY_PUBLIC_DOMAIN}}` (not `RAILWAY_PRIVATE_DOMAIN`)
   - OR is set to a full public URL like `https://your-domain.railway.app`
2. **DO NOT** use `${{RAILWAY_PRIVATE_DOMAIN}}` - that resolves to `.railway.internal`

**Note**: The `railway-plausible.json` is already configured to use `${{RAILWAY_PUBLIC_DOMAIN}}`. Just make sure you've generated a public domain!

### Step 4: Verify Other Required Variables

While you're there, make sure these are set correctly:

```bash
SMTP_HOST_SSL_ENABLED=false  ← You just fixed this!
RESEND_API_KEY=re_your_api_key  ← Required for Resend SMTP
DISABLE_REGISTRATION=true
SMTP_MX_LOOKUPS=false
SMTP_VERIFY=false
```

**Note**: The configuration now uses Resend's SMTP (`smtp.resend.com:587`), so make sure `RESEND_API_KEY` is set in your Railway variables. This should already exist if you're using Resend elsewhere in your project.

### Step 5: Redeploy

1. After fixing all empty boolean variables
2. Go to the **Deployments** tab
3. Trigger a new deployment (or wait for auto-redeploy)
4. Check the logs to verify it starts successfully

## 🔍 How to Find the Problem Variable

If you're not sure which variable is causing the issue:

1. **Check Railway Logs** - The error might show which variable is problematic
2. **Look for Recently Added Variables** - Empty variables are often accidentally added
3. **Common Culprits**:
   - Variables that were cleared/deleted but Railway kept them
   - Variables added through the UI with no value
   - Variables from templates that weren't filled in

## 📋 Verification Checklist

After fixing:

- [ ] `SMTP_HOST_SSL_ENABLED=false` is set (if you had boolean error)
- [ ] `PLAUSIBLE_BASE_URL` starts with `https://` or `http://` (not `.railway.internal`)
- [ ] `RESEND_API_KEY` is set (required for Resend SMTP)
- [ ] No environment variables have empty `""` values
- [ ] `DISABLE_REGISTRATION=true` is set
- [ ] `SMTP_MX_LOOKUPS=false` is set
- [ ] `SMTP_VERIFY=false` is set
- [ ] Service has been redeployed
- [ ] Logs show successful startup (no errors)

## 🎯 Quick Command Fix (Railway CLI)

If you have Railway CLI linked, you can use:

```bash
# Fix the SMTP_HOST_SSL_ENABLED variable (if you have boolean error)
railway variables set SMTP_HOST_SSL_ENABLED=false

# Fix the BASE_URL variable (if you have URL format error)
railway variables set PLAUSIBLE_BASE_URL="https://your-service-name.railway.app"

# Or if you want to set it for the specific service
railway variables set SMTP_HOST_SSL_ENABLED=false --service plausible
railway variables set PLAUSIBLE_BASE_URL="https://your-service-name.railway.app" --service plausible

# Verify RESEND_API_KEY is set (should already exist from main project)
railway variables get RESEND_API_KEY

# Verify BASE_URL is correct
railway variables get PLAUSIBLE_BASE_URL

# List all variables to verify
railway variables

# Delete an empty variable if needed (replace VARIABLE_NAME)
railway variables unset VARIABLE_NAME
```

## ⚠️ Prevention

To avoid this in the future:

- **Never** set boolean variables to empty strings in Railway
- **Always** use `true` or `false` for boolean values
- **Delete** variables you don't need instead of leaving them empty
- **Verify** all variables have values before deploying
