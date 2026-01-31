# Placeholder Replacement Issue - Fixed

**Date:** January 31, 2026  
**Issue:** Placeholders not being replaced on live server  
**Root Cause:** Wrong company data in `globalSettings` database table

## Problem Discovered

The `placeholder-utils.ts` file gets company data from the `globalCompanyData()` function, which:

1. **First** checks the `globalSettings` database table
2. **Then** falls back to environment variables if not in database

The CAPCO production database had **Rothco Built** data instead of **CAPCO Design Group** data!

### Evidence

Query result before fix:

```json
{
  "companyName": "Rothco Built",
  "website": "https://rothcollc.com",
  "email": "scott@rothcollc.com",
  "phone": "+1 (857) 385-8579"
}
```

This explains why placeholders like `{{COMPANY_NAME}}` were showing "Rothco Built" on capcofire.com!

## Solution Applied

Updated the `globalSettings` table with correct CAPCO data:

```sql
UPDATE "globalSettings" SET value = 'CAPCO Design Group' WHERE key = 'companyName';
UPDATE "globalSettings" SET value = 'https://capcofire.com' WHERE key = 'website';
UPDATE "globalSettings" SET value = 'contact@capcofire.com' WHERE key = 'email';
UPDATE "globalSettings" SET value = '+16175810583' WHERE key = 'phone';
UPDATE "globalSettings" SET value = 'Professional Fire Protection Plan Review & Approval' WHERE key = 'slogan';
UPDATE "globalSettings" SET value = '#825BDD' WHERE key = 'primary_color';
UPDATE "globalSettings" SET value = '#0ea5e9' WHERE key = 'secondary_color';
```

### Results After Fix

```json
{
  "companyName": "CAPCO Design Group",
  "website": "https://capcofire.com",
  "email": "contact@capcofire.com",
  "phone": "+16175810583",
  "slogan": "Professional Fire Protection Plan Review & Approval",
  "primary_color": "#825BDD",
  "secondary_color": "#0ea5e9"
}
```

## How Placeholder Replacement Works

### Code Flow

```typescript
// 1. placeholder-utils.ts calls globalCompanyData()
const companyData = await globalCompanyData();

// 2. global-company-data.ts fetches from database first
const settings = await getAllSettings(); // Queries globalSettings table

// 3. Helper function with fallback
const get = (key: string, envKey?: string): string => {
  const dbValue = settings[key]; // Priority 1: Database
  if (dbValue) return dbValue;
  if (envKey && process.env[envKey])
    // Priority 2: Environment variable
    return process.env[envKey];
  return ""; // Fallback: empty string
};

// 4. Placeholders are replaced
result = result.replace(/\{\{COMPANY_NAME\}\}/g, companyData.globalCompanyName);
```

### Placeholder Replacements

The following placeholders are now correctly replaced:

- `{{COMPANY_NAME}}` → "CAPCO Design Group"
- `{{RAILWAY_PROJECT_NAME}}` → "CAPCO Design Group"
- `{{GLOBAL_COMPANY_NAME}}` → "CAPCO Design Group"
- `{{GLOBAL_COMPANY_WEBSITE}}` → "https://capcofire.com"
- `{{GLOBAL_COMPANY_EMAIL}}` → "contact@capcofire.com"
- `{{GLOBAL_COMPANY_PHONE}}` → "+16175810583"
- `{{GLOBAL_COMPANY_SLOGAN}}` → "Professional Fire Protection Plan Review & Approval"
- `{{GLOBAL_COLOR_PRIMARY}}` → "#825BDD"
- `{{GLOBAL_COLOR_SECONDARY}}` → "#0ea5e9"

## Why This Happened

The `globalSettings` table likely got populated with Rothco data during development/testing, or there was a data migration issue between client databases.

### Data Priority Order

```
Database (globalSettings table)  ←  HIGHEST PRIORITY
        ↓ (if not found)
Environment Variables (Railway)
        ↓ (if not found)
Default/Fallback Values           ←  LOWEST PRIORITY
```

## Testing the Fix

### 1. Check Database Values

```sql
SELECT key, value FROM "globalSettings"
WHERE key IN ('companyName', 'website', 'email', 'phone', 'slogan', 'primary_color', 'secondary_color')
ORDER BY key;
```

**Expected Result:** All values should show CAPCO data

### 2. Test Placeholder Replacement

Create a test page with placeholders:

```html
<p>Company: {{COMPANY_NAME}}</p>
<p>Website: {{GLOBAL_COMPANY_WEBSITE}}</p>
<p>Email: {{GLOBAL_COMPANY_EMAIL}}</p>
<p>Phone: {{GLOBAL_COMPANY_PHONE}}</p>
<p>Color: {{GLOBAL_COLOR_PRIMARY}}</p>
```

**Expected Output:**

```html
<p>Company: CAPCO Design Group</p>
<p>Website: https://capcofire.com</p>
<p>Email: contact@capcofire.com</p>
<p>Phone: +16175810583</p>
<p>Color: #825BDD</p>
```

### 3. Check Live Server

Visit any page on capcofire.com that uses placeholders:

- Email templates
- PDF documents
- CMS content
- Status messages

All should now show "CAPCO Design Group" instead of "Rothco Built"

## Preventing This in the Future

### 1. Seed Data Scripts

Create separate seed scripts for each client:

**`sql-queriers/seed-capco-global-settings.sql`** ← Created  
**`sql-queriers/seed-rothco-global-settings.sql`** (for Rothco)

### 2. Database Migration Checklist

When setting up a new client or migrating data:

1. ✅ Create `globalSettings` table
2. ✅ Run client-specific seed script
3. ✅ Verify settings with query
4. ✅ Test placeholder replacement
5. ✅ Check live site

### 3. Admin Panel

Create an admin panel at `/admin/settings` to:

- View current `globalSettings` values
- Edit company data via UI
- Preview placeholder replacements
- Export/Import settings

### 4. Automated Tests

Add tests to verify placeholders are replaced correctly:

```typescript
// tests/placeholder-replacement.test.ts
test("replaces company name placeholder", async () => {
  const result = await replacePlaceholders("Hello {{COMPANY_NAME}}");
  expect(result).toBe("Hello CAPCO Design Group");
  expect(result).not.toContain("Rothco");
});
```

## Related Files

- ✅ `src/lib/placeholder-utils.ts` - Placeholder replacement logic
- ✅ `src/pages/api/global/global-company-data.ts` - Fetches company data
- ✅ `sql-queriers/fix-capco-global-settings.sql` - Fix script created
- ✅ `sql-queriers/create-global-settings-table.sql` - Table schema
- `markdowns/RAILWAY_VARIABLES_CHECKLIST.md` - Environment variable guide

## Summary

**Issue:** Placeholders showing wrong company (Rothco instead of CAPCO)  
**Cause:** `globalSettings` database table had wrong data  
**Fix:** Updated database with correct CAPCO values  
**Status:** ✅ **FIXED**

All placeholders on capcofire.com will now correctly show CAPCO Design Group information.

## Next Steps

1. ✅ Database updated with correct CAPCO data
2. ⚠️ Clear any caches (1-minute TTL should auto-expire)
3. ⚠️ Test a few pages to verify placeholders
4. ⚠️ Create seed scripts for other clients (Rothco, etc.)
5. ⚠️ Document the `globalSettings` table structure
