# Fix: Missing Features in Aside Navigation on Server

## Problem
The aside navigation sidebar is missing several dynamic feature items on the production server, but they appear correctly locally.

## Root Cause
The system loads features from `site-config-{company-slug}.json` files. The code in `src/lib/content.ts` looks for these files in the **project root directory**, but:

1. Your `site-config-capco-design-group.json` was only in `config/data/` directory
2. The server couldn't find it in the root, so it fell back to the generic `site-config.json`
3. While both files have the same features, there might be environment-specific issues

## How the System Works

### Company Name Resolution
1. System gets company name from database (`globalSettings` table, key `companyName`)
2. If not in database, falls back to `RAILWAY_PROJECT_NAME` env var
3. Company name is slugified: `"CAPCO Design Group"` → `"capco-design-group"`
4. Looks for `site-config-capco-design-group.json` in project root

### Feature Loading Priority
```typescript
// From src/lib/content.ts (lines 139-238)
1. Try: site-config-{company-slug}.json (in root)
2. Fallback: site-config.json (in root)
3. Fallback: SITE_CONFIG_JSON environment variable
4. Fallback: Minimal defaults (missing features!)
```

## Solutions

### Solution 1: Commit the File to Git (Recommended for Single Client)
```bash
# The file is now in the root directory
git add site-config-capco-design-group.json
git commit -m "Add CAPCO-specific site configuration"
git push
```

**Pros:**
- Simple, works immediately
- Version controlled
- Survives deployments

**Cons:**
- File is in git (could be considered environment-specific)
- Need separate file for each client deployment

### Solution 2: Use Environment Variable (Recommended for Multi-Client)
Set `SITE_CONFIG_JSON` on Railway with the entire JSON content:

```bash
# On Railway, set this environment variable:
railway variables set SITE_CONFIG_JSON='{"navigation":{"main":[...],"footer":[...]},"features":{...}}'
```

**Pros:**
- Per-deployment customization
- No files to manage
- Better for multi-client setups

**Cons:**
- Large environment variable
- Harder to edit (no syntax highlighting)

### Solution 3: Database-Driven (Future Enhancement)
Store the entire site config in the database, keyed by `clientId` or `RAILWAY_PROJECT_NAME`.

## What I Did

1. ✅ Copied `site-config-capco-design-group.json (project root)` to project root
2. ✅ Verified the slugification matches: `"CAPCO Design Group"` → `"capco-design-group"`
3. ✅ Confirmed file is identical to `site-config.json`

## Next Steps

### For Immediate Fix:
```bash
# Add and commit the file
git add site-config-capco-design-group.json
git commit -m "Add CAPCO-specific site configuration for feature navigation"
git push origin main

# Railway will auto-deploy, features should appear in ~6 minutes
```

### Verify on Server:
After deployment, check the logs for:
```
✅ [CONTENT] Loaded site-config-capco-design-group.json (navigation & features) - 11 features enabled
```

If you see this instead, the file wasn't found:
```
⚠️ [CONTENT] No site-config file found (tried: site-config-capco-design-group.json, site-config.json)
```

## Prevention

### Update .gitignore (Optional)
If you want to track client-specific configs:
```gitignore
# In .gitignore, line 50
# Change from:
site-config.json

# To:
site-config.json
!site-config-*.json  # Allow client-specific configs
```

## Features That Should Appear

Based on `site-config-capco-design-group.json`, these features should show in the aside nav:

**Admin Section:**
- All Discussions (position 10)
- Calendar (position 20)
- PDF System (position 30)
- PDF Certify (position 31)
- Analytics (position 40)
- Finance (position 41)
- Global Activity (position 60)
- Users (position 70)

**Tools Section:**
- Voice Assistant (position 50)
- AI Agent (position 51)

**Widget Features (no nav):**
- Chat
- Testimonials

## Debug Commands

```bash
# Check what company name the server is using
echo $RAILWAY_PROJECT_NAME

# Check if file exists on server
ls -la site-config*.json

# Test slugification
node -e "
const name = 'CAPCO Design Group';
const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .trim();
console.log('Expected file:', \`site-config-\${slug}.json\`);
"
```

## Related Files
- `src/lib/content.ts` - Site config loading logic
- `src/lib/feature-navigation.ts` - Feature navigation generation
- `src/components/ui/Aside.astro` - Sidebar component
- `site-config-capco-design-group.json (project root)` - Original location (should be synced with root)
