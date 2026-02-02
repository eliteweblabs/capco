# Converting globalSettings Keys to camelCase

## Overview
This migration converts all database keys in the `globalSettings` table from snake_case to camelCase to maintain consistency with JavaScript/TypeScript naming conventions.

## Changes Made

### Database Keys Converted

| Old Key (snake_case) | New Key (camelCase) |
|---------------------|---------------------|
| `plausible_tracking_script` | `plausibleTrackingScript` |
| `secondary_color` | `secondaryColor` |
| `font_family` | `fontFamily` |
| `social_networks` | `socialNetworks` |
| `secondary_font_family` | `secondaryFontFamily` |
| `og_image` | `ogImage` |
| `primary_color` | `primaryColor` |
| `plausible_script_url` | `plausibleScriptUrl` |
| `plausible_site_id` | `plausibleSiteId` |
| `plausible_domain` | `plausibleDomain` |
| `custom_css` | `customCss` |

### Files Updated

#### 1. `/sql-queriers/convert-settings-to-camelcase.sql`
Migration script to update existing database records from snake_case to camelCase.

#### 2. `/src/pages/api/global/global-company-data.ts`
Updated all `get()` calls to use camelCase keys:
- `get("primaryColor", ...)` instead of `get("primary_color", ...)`
- `get("secondaryColor", ...)` instead of `get("secondary_color", ...)`
- `get("fontFamily", ...)` instead of `get("font_family", ...)`
- `get("secondaryFontFamily", ...)` instead of `get("secondary_font_family", ...)`
- `get("plausibleTrackingScript", ...)` instead of `get("plausible_tracking_script", ...)`
- `get("ogImage", ...)` instead of `get("og_image", ...)`
- `get("socialNetworks")` instead of `get("social_networks")`
- `get("customCss")` instead of `get("custom_css")`

#### 3. `/src/pages/admin/settings.astro`
Updated in multiple places:

**Form Field Mapping (JavaScript):**
```javascript
const fieldMapping: Record<string, string> = {
  primary_color: "primaryColor",      // Form field -> DB key
  secondary_color: "secondaryColor",
  font_family: "fontFamily",
  secondary_font_family: "secondaryFontFamily",
  og_image: "ogImage",
  plausible_tracking_script: "plausibleTrackingScript",
  social_networks: "socialNetworks",
  custom_css: "customCss",
  // ... etc
};
```

**Database Indicator Labels:**
Updated all `isFromDatabase()` calls to use camelCase:
```astro
{isFromDatabase("primaryColor") && (...)}
{isFromDatabase("secondaryColor") && (...)}
{isFromDatabase("fontFamily") && (...)}
{isFromDatabase("secondaryFontFamily") && (...)}
{isFromDatabase("plausibleTrackingScript") && (...)}
{isFromDatabase("customCss") && (...)}
{isFromDatabase("ogImage") && (...)}
```

**JavaScript Settings Checks:**
Updated property checks in the save handler:
```javascript
if (settings.primaryColor || settings.secondaryColor || 
    settings.fontFamily || settings.secondaryFontFamily) {
  // ... handle updates
}
```

## Migration Steps

### For Existing Databases

1. **Backup your database** before running the migration:
   ```bash
   pg_dump your_database > backup.sql
   ```

2. **Run the migration script**:
   ```bash
   psql your_database < sql-queriers/convert-settings-to-camelcase.sql
   ```

3. **Verify the migration**:
   ```sql
   SELECT key, category, "valueType" 
   FROM "globalSettings" 
   WHERE key LIKE '%_%'
   ORDER BY key;
   ```
   This should return no results (no snake_case keys remaining).

### For New Deployments
No action needed - the code now uses camelCase keys by default.

## Benefits

1. **Consistency**: JavaScript/TypeScript convention is camelCase
2. **Type Safety**: Easier to work with in TypeScript without string literal types
3. **Reduced Errors**: No more mixing snake_case and camelCase
4. **Better IDE Support**: IntelliSense works better with camelCase
5. **Cleaner Code**: No need for property name transformations

## Backward Compatibility

⚠️ **Breaking Change**: This is a breaking change if you have existing settings in the database using snake_case keys.

**Required Actions:**
- Run the migration script on existing databases
- Clear settings cache after migration
- Restart the application

## Testing Checklist

After migration, verify:
- [ ] Settings page loads without errors
- [ ] All settings display correctly
- [ ] Form submission works
- [ ] Database indicator (💾) shows correctly
- [ ] Color picker updates work
- [ ] Font family changes work
- [ ] Logo and icon updates work
- [ ] Custom CSS saves correctly
- [ ] Social networks save correctly
- [ ] OG image saves correctly

## Rollback Plan

If issues occur, you can rollback:

```sql
-- Rollback to snake_case (if needed)
UPDATE "globalSettings" SET key = 'plausible_tracking_script' WHERE key = 'plausibleTrackingScript';
UPDATE "globalSettings" SET key = 'secondary_color' WHERE key = 'secondaryColor';
UPDATE "globalSettings" SET key = 'font_family' WHERE key = 'fontFamily';
UPDATE "globalSettings" SET key = 'social_networks' WHERE key = 'socialNetworks';
UPDATE "globalSettings" SET key = 'secondary_font_family' WHERE key = 'secondaryFontFamily';
UPDATE "globalSettings" SET key = 'og_image' WHERE key = 'ogImage';
UPDATE "globalSettings" SET key = 'primary_color' WHERE key = 'primaryColor';
UPDATE "globalSettings" SET key = 'custom_css' WHERE key = 'customCss';
```

Then revert the code changes using git.

## Notes

- Form field names (HTML inputs) still use snake_case for consistency with naming conventions
- The mapping happens in JavaScript before sending to the API
- Database keys are now strictly camelCase
- Environment variable fallbacks still work (they use SCREAMING_SNAKE_CASE)
