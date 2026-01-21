# Multi-Client Site Config Setup

## Overview

The site configuration system now uses the same pattern as `project-form-config` files:
- **Pattern**: `site-config-{company-slug}.json`
- **Matches**: `project-form-config-{company-slug}.ts`

## How It Works

1. **Company Name Detection**: Gets company name from `globalSettings.company_name` or `RAILWAY_PROJECT_NAME` env var
2. **Slug Generation**: Converts to slug using same logic as `project-form-config.ts`:
   - "CAPCo Design Group" → `capco-design-group`
   - "Rothco Built" → `rothco-built`
3. **Config File Loading**: Tries `site-config-{company-slug}.json`, falls back to `site-config.json`

## Files

### Current Config Files
- ✅ `site-config-rothco-built.json` - For Rothco Built
- ✅ `site-config-capco-design-group.json` - For CAPCo Design Group
- ⚠️ `site-config.json` - Generic fallback (gitignored, not committed)

### Git Status
- ✅ Client-specific configs (`site-config-*.json`) are **committed** to git
- ❌ Generic `site-config.json` is **gitignored** (use client-specific instead)

## Adding a New Client

1. **Create config file**:
   ```bash
   cp site-config-capco-design-group.json site-config-{company-slug}.json
   ```

2. **Customize features** in the new file:
   - Enable/disable features
   - Adjust navigation items
   - Set feature positions and roles

3. **Commit the file**:
   ```bash
   git add site-config-{company-slug}.json
   git commit -m "Add site-config for {company-name}"
   ```

4. **Deploy**: Railway will automatically use the correct config file based on `RAILWAY_PROJECT_NAME`

## Example

If `RAILWAY_PROJECT_NAME="ACME Fire Protection"`:
- Slug: `acme-fire-protection`
- Config file: `site-config-acme-fire-protection.json`
- Project form config: `project-form-config-acme-fire-protection.ts`

## Debugging

Check logs for config loading:
```bash
railway logs --service {service-name} | grep CONTENT
```

You should see:
- ✅ `Loaded site-config-{company-slug}.json (navigation & features) - X features enabled`
- ⚠️ `No site-config file found` - means file doesn't exist or slug doesn't match

## Benefits

1. ✅ **Same pattern** as project-form-config (consistent codebase)
2. ✅ **Committed to git** (no deployment issues)
3. ✅ **Per-client customization** (each client can have different features)
4. ✅ **Automatic detection** (no manual configuration needed)
