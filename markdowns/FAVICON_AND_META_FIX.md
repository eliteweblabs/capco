# Favicon and Header Meta Fix

## Problem
When saving the site as a home screen shortcut on mobile, users saw:
- **Old company name** (e.g. CAPCO instead of Rothco Built)
- **Wrong image** (default favicon instead of company icon)

## Root Causes

1. ** manifest.json** was static and built at deploy time with hardcoded values
2. **short_name** in manifest template was hardcoded to "CAPCO"
3. **meta author** in App.astro was hardcoded to "Tomsens+REKKO"
4. **OG image fallback** used Capco-specific path with typo (`/videos/CACPCO-share-preview.gif`)

## Fixes Applied

### 1. Dynamic Manifest (`/manifest.json`)
- New server endpoint `src/pages/manifest.json.ts` serves manifest per-request using `globalCompanyData()`
- Name, short_name, theme_color, description, and icons now use current site config
- Favicon icons use `/api/favicon.svg` for company-specific icon

### 2. Dynamic Favicon (`/api/favicon.svg`)
- New endpoint returns company SVG from `globalSettings.icon`
- Falls back to redirect to `/favicon.svg` when no icon in DB

### 3. App.astro Meta Fixes
- `meta name="author"` now uses `globalCompanyName`
- OG image fallback removed (was Capco-specific); uses `ogImage` from CMS only

### 4. Manifest Template & Build Script
- `short_name` placeholder `{{SHORT_NAME}}` derived from company name (first word or first 12 chars)
- `process-manifest.js` supports both camelCase and snake_case DB keys
- Fallback company name changed from "CAPCO Design Group" to "Company Name Not Set"

### 5. Gitignore
- `public/manifest.json` added to gitignore (build output; dynamic endpoint serves live)

## Result
- Add-to-homescreen uses correct company name and icon from database
- Meta tags and OG image use current site config
- Works for all deployments (Rothco, Capco, etc.) without per-tenant code
