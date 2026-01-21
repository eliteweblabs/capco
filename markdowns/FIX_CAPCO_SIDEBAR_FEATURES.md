# Fix Capco Missing Sidebar Features

## Problem
Capco sidebar is missing items because `site-config.json` file doesn't exist on Railway deployment.

## Root Cause
- `site-config.json` is gitignored (not committed to git)
- Railway deployments don't include gitignored files
- Code falls back to minimal defaults when file is missing
- Result: Only 3 features instead of 10+

## Solution Options

### Option 1: Add site-config.json to Railway Volume (Recommended)

1. **Create Railway Volume** (if not exists):
   ```bash
   railway volume create --service capco --mount /app/data
   ```

2. **Copy site-config.json to volume**:
   ```bash
   # SSH into Railway or use Railway CLI
   railway run --service capco bash
   # Then copy your local site-config.json to /app/data/site-config.json
   ```

3. **Update code to check volume path** (already done in the fix)

### Option 2: Use Environment Variable (Easiest)

Add `SITE_CONFIG_JSON` environment variable to Capco Railway service:

1. **Get your site-config.json content**:
   ```bash
   cat site-config.json | jq -c .
   ```

2. **Add to Railway**:
   - Go to Capco service in Railway dashboard
   - Settings → Variables
   - Add variable: `SITE_CONFIG_JSON`
   - Paste the minified JSON (single line, no formatting)
   - Save

3. **Redeploy** (or restart service)

### Option 3: Commit site-config.json (Not Recommended)

If you want to commit it (not recommended for multi-client setup):

1. Remove from `.gitignore`:
   ```bash
   # Remove line 50: site-config.json
   ```

2. Commit the file:
   ```bash
   git add site-config.json
   git commit -m "Add site-config.json for Capco"
   git push
   ```

3. Railway will auto-deploy

## Verification

After applying the fix, check Railway logs:

```bash
railway logs --service capco | grep CONTENT
```

You should see:
- ✅ `Loaded site-config.json (navigation & features) - X features enabled` (if file exists)
- ✅ `Loaded site-config from SITE_CONFIG_JSON env var - X features enabled` (if env var used)
- ⚠️ `site-config.json not found` (if neither exists - this is the problem)

## Expected Features (from site-config.json)

After fix, sidebar should show:
- ✅ All Discussions
- ✅ Calendar  
- ✅ PDF System
- ✅ PDF Certify
- ✅ Analytics
- ✅ Finance
- ✅ Voice Assistant
- ✅ AI Agent
- ✅ Global Activity
- ✅ Users

## Quick Fix (Environment Variable)

**Fastest solution** - Add this to Capco Railway environment variables:

```bash
# Variable name: SITE_CONFIG_JSON
# Value: (paste minified site-config.json content)
```

To get the value:
```bash
cat site-config.json | jq -c . | pbcopy  # macOS
cat site-config.json | jq -c . | xclip   # Linux
```

Then restart/redeploy Capco service.

## Code Changes Made

Updated `src/lib/content.ts` to:
1. ✅ Add better logging when file is missing
2. ✅ Support `SITE_CONFIG_JSON` environment variable fallback
3. ✅ Log feature count for debugging

## Next Steps

1. ✅ Choose a solution (Option 2 is fastest)
2. ✅ Apply the fix
3. ✅ Check Railway logs to verify
4. ✅ Test sidebar on Capco website
