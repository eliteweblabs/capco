# Manifest Processor Update

**Date**: January 27, 2026  
**Script**: `scripts/process-manifest.js`

## Overview

Updated the `process-manifest.js` script to use the CMS database (`globalSettings` table) instead of outdated environment variables.

## Changes Made

### 1. Data Source Priority
The script now fetches data in this order:
1. **CMS Database** (`globalSettings` table) - PRIMARY SOURCE
2. **Environment Variables** - Fallback if database unavailable
3. **Hard-coded defaults** - Last resort

### 2. Database Integration
- Connects directly to Supabase using `@supabase/supabase-js`
- Fetches all settings from `globalSettings` table
- Maps database keys to manifest values:
  - `companyName` → `name`, `short_name`
  - `slogan` → `description`
  - `primary_color` → `theme_color`
  - `website` → Used for URLs if needed

### 3. PWA Shortcuts (Configurable)
The script now supports configurable PWA shortcuts via `site-config-{company-slug}.json`:

```json
{
  "pwa": {
    "shortcuts": [
      {
        "name": "New Project",
        "short_name": "New",
        "description": "Create a new fire protection project",
        "url": "/project/new",
        "icons": []
      },
      {
        "name": "Dashboard",
        "short_name": "Dashboard",
        "description": "View your dashboard",
        "url": "/project/dashboard",
        "icons": []
      }
    ]
  }
}
```

If no `pwa.shortcuts` configuration exists, it uses a sensible default.

### 4. Template Updates
- Updated `public/manifest.json.template` to remove hardcoded shortcut URLs
- Template now has empty `shortcuts: []` that gets populated at build time

## How It Works

1. **Build Time**: Script runs during `npm run build` or `npm run dev`
2. **Database First**: Tries to connect to Supabase and fetch settings
3. **Env Fallback**: If database unavailable, uses environment variables
4. **Site Config**: Loads `site-config-{company-slug}.json` for PWA shortcuts
5. **Output**: Generates `public/manifest.json` with processed values

## Testing

```bash
# Test the script
node scripts/process-manifest.js

# Expected output:
# 🔧 Processing manifest.json with CMS data...
# 📊 Company: CAPCO Design Group
# 📊 Slogan: Professional Fire Protection Plan Review & Approval
# 📊 Theme Color: #825BDD
# 📊 Site URL: https://RAILWAY_PUBLIC_DOMAIN
# ✅ Manifest.json processed successfully!
```

## Benefits

1. ✅ **Centralized Configuration**: All company data in one place (CMS database)
2. ✅ **No Code Changes**: Update manifest by changing database values
3. ✅ **Multi-Client Support**: Different values per Railway deployment
4. ✅ **Backwards Compatible**: Falls back to env vars if database unavailable
5. ✅ **Configurable Shortcuts**: PWA shortcuts customizable per client

## Environment Variables Still Used

These are now fallbacks only:
- `RAILWAY_PROJECT_NAME` → Fallback for company name
- `GLOBAL_COMPANY_SLOGAN` → Fallback for slogan
- `GLOBAL_COLOR_PRIMARY` → Fallback for theme color
- `GLOBAL_COLOR_SECONDARY` → Fallback for secondary color
- `RAILWAY_PUBLIC_DOMAIN` → Fallback for site URL

## Database Schema

The script expects these keys in the `globalSettings` table:

| Key | Type | Used For | Example |
|-----|------|----------|---------|
| `companyName` | text | App name | "CAPCO Design Group" |
| `slogan` | text | App description | "Professional Fire Protection..." |
| `primary_color` | text | Theme color | "#825BDD" |
| `secondary_color` | text | Accent color | "#0ea5e9" |
| `website` | text | Site URL | "https://RAILWAY_PUBLIC_DOMAIN" |

## Future Enhancements

Potential improvements:
- [ ] Store PWA shortcuts in database instead of JSON files
- [ ] Add icon generation for shortcuts
- [ ] Support for screenshots array
- [ ] Dynamic categories based on features enabled
- [ ] PWA install prompt customization

## Related Files

- `scripts/process-manifest.js` - Main processor script
- `public/manifest.json.template` - Template with placeholders
- `public/manifest.json` - Generated output (gitignored)
- `src/lib/content.ts` - CMS data loader (reference)
- `src/pages/api/global/global-company-data.ts` - Database schema (reference)
- `site-config-*.json` - Per-client configuration files
