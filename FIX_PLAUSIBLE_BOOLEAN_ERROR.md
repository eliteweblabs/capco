# 🔧 Quick Fix: Plausible Boolean Value Error

## 🚨 Error
```
Invalid boolean value: "". Expected one of: 1, 0, t, f, true, false, y, n, yes, no, on, off
```

## 🎯 **THE PROBLEM VARIABLE: `SMTP_HOST_SSL_ENABLED`**

**Root Cause**: The `SMTP_HOST_SSL_ENABLED` environment variable is set to an empty string (`""`) when it should be `true` or `false`.

**Good News**: The configuration has been updated to use **Resend's SMTP** instead of a local mail service. For Resend SMTP on port 587, you should set this to `false`.

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

### Step 3: Fix `SMTP_HOST_SSL_ENABLED` (REQUIRED)
**This is the variable causing your error!**

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
- [ ] `SMTP_HOST_SSL_ENABLED=false` is set (this was the problem!)
- [ ] `RESEND_API_KEY` is set (required for Resend SMTP)
- [ ] No environment variables have empty `""` values
- [ ] `DISABLE_REGISTRATION=true` is set
- [ ] `SMTP_MX_LOOKUPS=false` is set
- [ ] `SMTP_VERIFY=false` is set
- [ ] Service has been redeployed
- [ ] Logs show successful startup (no boolean errors)

## 🎯 Quick Command Fix (Railway CLI)

If you have Railway CLI linked, you can use:

```bash
# Fix the SMTP_HOST_SSL_ENABLED variable (this is the problem!)
railway variables set SMTP_HOST_SSL_ENABLED=false

# Or if you want to set it for the specific service
railway variables set SMTP_HOST_SSL_ENABLED=false --service plausible

# Verify RESEND_API_KEY is set (should already exist from main project)
railway variables get RESEND_API_KEY

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

