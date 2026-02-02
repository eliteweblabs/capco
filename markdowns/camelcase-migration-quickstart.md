# CamelCase Conversion - Quick Start

## What Changed
All `globalSettings` database keys have been converted from `snake_case` to `camelCase`.

## Files Modified
1. ✅ `/src/pages/api/global/global-company-data.ts` - Updated to read camelCase keys
2. ✅ `/src/pages/admin/settings.astro` - Updated form mapping and checks
3. ✅ `/src/pages/api/settings/update.ts` - Already handled via mapping
4. ✅ `/sql-queriers/convert-settings-to-camelcase.sql` - Migration script created

## Quick Migration (3 steps)

### Step 1: Backup
```bash
# Backup your database first!
pg_dump your_database_name > backup-before-camelcase.sql
```

### Step 2: Run Migration
```bash
# Connect to your database and run:
psql your_database_name < sql-queriers/convert-settings-to-camelcase.sql
```

### Step 3: Verify
Visit `/admin/settings` and check that:
- All settings load correctly
- You can save changes
- No console errors appear

## Key Conversions
- `primary_color` → `primaryColor`
- `secondary_color` → `secondaryColor`  
- `font_family` → `fontFamily`
- `secondary_font_family` → `secondaryFontFamily`
- `og_image` → `ogImage`
- `plausible_tracking_script` → `plausibleTrackingScript`
- `social_networks` → `socialNetworks`
- `custom_css` → `customCss`

## Testing
After migration, test:
- [ ] Load settings page
- [ ] Save a color change
- [ ] Save a font change
- [ ] Update logo classes
- [ ] Check dark mode toggle

## Rollback
If issues occur, restore from backup:
```bash
psql your_database_name < backup-before-camelcase.sql
```

See `markdowns/camelcase-migration.md` for detailed documentation.
