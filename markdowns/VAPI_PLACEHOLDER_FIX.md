# VAPI Placeholder Fix - Railway Environment Variables

**Date:** January 31, 2026  
**Issue:** Placeholders like `{{COMPANY_NAME}}` are not being replaced on the live server

## Problem

The `vapi-capco-config.js` script uses environment variables to replace placeholders, but these variables are **not set in Railway**:

1. `RAILWAY_PROJECT_NAME` - Used to replace `{{COMPANY_NAME}}`
2. `RAILWAY_PUBLIC_DOMAIN` - Used for webhook URLs

### Code Reference

```javascript
// vapi-capco-config.js lines 76-79
const COMPANY_NAME_ENV_VAR = "RAILWAY_PROJECT_NAME";
const DEFAULT_COMPANY_NAME = "CAPCO Design Group";

// Line 100
const companyName = process.env[COMPANY_NAME_ENV_VAR] || DEFAULT_COMPANY_NAME;
const replaced = text.replace(/\{\{\s*COMPANY_NAME\s*\}\}/g, companyName);
```

### What's Happening

1. Script runs on Railway
2. Tries to read `process.env.RAILWAY_PROJECT_NAME` → **undefined**
3. Falls back to `DEFAULT_COMPANY_NAME` = "CAPCO Design Group"
4. But the replacement might still fail if the env var check happens elsewhere

## Solution: Add Railway Environment Variables

### Option 1: Set Railway-Specific Variables (Recommended)

Go to **Railway Dashboard → Your Project → Variables** and add:

```bash
RAILWAY_PROJECT_NAME="CAPCO Design Group"
RAILWAY_PUBLIC_DOMAIN="capcofire.com"
```

**Notes:**
- Don't include `https://` in `RAILWAY_PUBLIC_DOMAIN` - the script adds it automatically
- Or include it: `RAILWAY_PUBLIC_DOMAIN="https://capcofire.com"` - the script handles both

### Option 2: Update the Script to Use Existing Variables

If you don't want to add new variables, modify `vapi-capco-config.js` to use variables that already exist:

```javascript
// Change line 76 from:
const COMPANY_NAME_ENV_VAR = "RAILWAY_PROJECT_NAME";

// To:
const COMPANY_NAME_ENV_VAR = "FROM_NAME"; // Already set: "CAPCO Design Group"

// And change lines 56-57 from:
let WEBHOOK_DOMAIN =
  process.env.RAILWAY_PUBLIC_DOMAIN || process.env.WEBHOOK_DOMAIN || "https://capcofire.com";

// To:
let WEBHOOK_DOMAIN = "https://capcofire.com"; // Just hardcode it for CAPCO
```

### Option 3: Remove Placeholder System (Simplest)

Since this is client-specific config, just replace the placeholders directly in the code:

```javascript
// Change line 149 from:
name: "{{COMPANY_NAME}} Receptionist",

// To:
name: "CAPCO Design Group Receptionist",

// Change line 160 from:
content: `# {{COMPANY_NAME}} Voice Assistant
You are a helpful voice assistant for {{COMPANY_NAME}}, specializing...

// To:
content: `# CAPCO Design Group Voice Assistant
You are a helpful voice assistant for CAPCO Design Group, specializing...
```

## Recommended Action

**Use Option 1** - Set the Railway variables. This is the cleanest solution and allows you to:

1. Keep the placeholder system working
2. Easily update company name in one place
3. Support multiple clients with different Railway projects

### Steps:

1. **Go to Railway Dashboard**
   - Project: `capcofire.com` (or your project name)
   - Tab: **Variables**

2. **Add New Variable**
   - Click "New Variable"
   - Name: `RAILWAY_PROJECT_NAME`
   - Value: `CAPCO Design Group`
   - Click "Add"

3. **Add Another Variable**
   - Click "New Variable"
   - Name: `RAILWAY_PUBLIC_DOMAIN`
   - Value: `capcofire.com` or `https://capcofire.com`
   - Click "Add"

4. **Redeploy**
   - Railway will automatically redeploy with new variables
   - Or manually trigger: Settings → Deployments → Redeploy

5. **Test**
   - Run the VAPI config script again
   - Check that placeholders are replaced:
     ```bash
     node scripts/vapi-capco-config.js
     ```
   - Look for: `📝 [VAPI-CAPCO] Company name set to: "CAPCO Design Group"`
   - Should NOT see: `⚠️ Found N unreplaced {{COMPANY_NAME}} placeholders`

## Verification

After setting variables and redeploying, verify:

1. **Check Environment Variables**
   ```bash
   # In Railway console or deployment logs
   echo $RAILWAY_PROJECT_NAME
   # Should output: CAPCO Design Group
   ```

2. **Check VAPI Assistant**
   - Go to VAPI Dashboard
   - Open assistant: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`
   - Check that name shows "CAPCO Design Group Receptionist"
   - Check that system prompt doesn't contain `{{COMPANY_NAME}}`

3. **Test Voice Call**
   - Start a voice call
   - Assistant should say "Thank you for calling CAPCO Design Group"
   - Not "Thank you for calling {{COMPANY_NAME}}"

## Why This Happened

The `.env` file in your local repo has these variables commented out:

```bash
# Line 32-33 in .env
# RAILWAY_PUBLIC_DOMAIN=https://capcofire.com
# N8N_WEBHOOK_URL=${RAILWAY_PUBLIC_DOMAIN}/api/webhook/incoming-call
```

This means:
- ✅ Works locally (uses fallback: `DEFAULT_COMPANY_NAME`)
- ❌ Fails on Railway (no env vars set, uses fallback but may have issues)

## Related Files

- `scripts/vapi-capco-config.js` - Main config script
- `scripts/vapi-rothco-built.js` - Similar script for Rothco
- `.env` - Local environment variables (not used in Railway)
- `markdowns/RAILWAY_VARIABLES_CHECKLIST.md` - Complete variable list

## Additional Railway Variables to Set

While you're in Railway Variables, also set these (see `RAILWAY_VARIABLES_CHECKLIST.md`):

### Required for Full Functionality
```bash
GLOBAL_COLOR_PRIMARY="#825BDD"           # Brand primary color
GLOBAL_COLOR_SECONDARY="#0ea5e9"         # Brand secondary color
GLOBAL_COMPANY_EMAIL="contact@capcofire.com"
GLOBAL_COMPANY_PHONE="+16175810583"
FROM_EMAIL="noreply@capcofire.com"
FROM_NAME="CAPCO Design Group"
```

### Optional but Recommended
```bash
GLOBAL_COMPANY_SLOGAN="Your Fire Protection Experts"
GLOBAL_COMPANY_ADDRESS="Your Address Here"
FONT_FAMILY="Outfit Variable"
```

## Testing the Fix

### Local Test
```bash
# Set env vars for local test
export RAILWAY_PROJECT_NAME="CAPCO Design Group"
export RAILWAY_PUBLIC_DOMAIN="capcofire.com"

# Run the script
node scripts/vapi-capco-config.js

# Should see:
# 📝 [VAPI-CAPCO] Company name set to: "CAPCO Design Group"
# ✅ [VAPI-CAPCO] Assistant updated successfully
```

### Railway Test
```bash
# After setting variables and redeploying, check logs:
# Railway Dashboard → Deployments → View Logs

# Look for:
# 📝 [VAPI-CAPCO] Company name set to: "CAPCO Design Group"
# ✅ [VAPI-CAPCO] Configuration complete!

# Should NOT see:
# ⚠️ WEBHOOK_DOMAIN contains a placeholder
# ⚠️ Found N unreplaced {{COMPANY_NAME}} placeholders
```

## Conclusion

**Immediate Action:** Set `RAILWAY_PROJECT_NAME` and `RAILWAY_PUBLIC_DOMAIN` in Railway Variables.

This will fix the placeholder replacement issue and ensure the VAPI assistant configuration works correctly on the live server.
