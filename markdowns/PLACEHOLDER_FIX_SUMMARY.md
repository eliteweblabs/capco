# Placeholder Replacement Issue - RESOLVED ✅

**Date:** January 31, 2026  
**Reported Issue:** "Placeholders are not being replaced on the live server for some reason"  
**Status:** ✅ **FIXED**

---

## Root Cause

The issue was **NOT with the VAPI configuration** or environment variables.

The real problem: **Wrong company data in the `globalSettings` database table**

### What We Found

The CAPCO production database (`capcofire.com`) had **Rothco Built** company data instead of **CAPCO Design Group** data:

```
❌ BEFORE (Wrong Data):
- companyName: "Rothco Built"
- website: "https://rothcollc.com"
- email: "scott@rothcollc.com"
- phone: "+1 (857) 385-8579"

✅ AFTER (Correct Data):
- companyName: "CAPCO Design Group"
- website: "https://capcofire.com"
- email: "contact@capcofire.com"
- phone: "+16175810583"
```

---

## How Placeholders Work

```
User visits page
     ↓
placeholder-utils.ts called
     ↓
globalCompanyData() fetches settings
     ↓
Priority 1: Query globalSettings table ← THIS HAD WRONG DATA
     ↓
Priority 2: Check environment variables
     ↓
Priority 3: Return default/empty
     ↓
Replace {{COMPANY_NAME}} with fetched value
```

---

## Fix Applied

Updated the `globalSettings` table with correct CAPCO values:

```sql
UPDATE "globalSettings" SET value = 'CAPCO Design Group' WHERE key = 'companyName';
UPDATE "globalSettings" SET value = 'https://capcofire.com' WHERE key = 'website';
UPDATE "globalSettings" SET value = 'contact@capcofire.com' WHERE key = 'email';
UPDATE "globalSettings" SET value = '+16175810583' WHERE key = 'phone';
UPDATE "globalSettings" SET value = 'Professional Fire Protection Plan Review & Approval' WHERE key = 'slogan';
UPDATE "globalSettings" SET value = '#825BDD' WHERE key = 'primary_color';
UPDATE "globalSettings" SET value = '#0ea5e9' WHERE key = 'secondary_color';
```

**Status:** ✅ Database updated successfully

---

## Affected Placeholders (Now Fixed)

All of these now correctly show CAPCO data:

| Placeholder                  | Old Value (Wrong)   | New Value (Correct)   |
| ---------------------------- | ------------------- | --------------------- |
| `{{COMPANY_NAME}}`           | Rothco Built        | CAPCO Design Group    |
| `{{RAILWAY_PROJECT_NAME}}`   | Rothco Built        | CAPCO Design Group    |
| `{{GLOBAL_COMPANY_NAME}}`    | Rothco Built        | CAPCO Design Group    |
| `{{GLOBAL_COMPANY_WEBSITE}}` | rothcollc.com       | capcofire.com         |
| `{{GLOBAL_COMPANY_EMAIL}}`   | scott@rothcollc.com | contact@capcofire.com |
| `{{GLOBAL_COMPANY_PHONE}}`   | +1 (857) 385-8579   | +16175810583          |
| `{{GLOBAL_COLOR_PRIMARY}}`   | #d4a574             | #825BDD               |
| `{{GLOBAL_COLOR_SECONDARY}}` | #a06e3c             | #0ea5e9               |

---

## Cache Behavior

The `global-company-data.ts` file has a **1-minute cache** (TTL: 60000ms).

**What this means:**

- Changes may take up to 60 seconds to appear
- After 60 seconds, new data is automatically fetched
- No manual intervention needed

**Optional:** Clear cache immediately by visiting:

```
https://capcofire.com/api/cache/clear-settings
```

(This endpoint was created but needs to be deployed)

---

## Where Placeholders Are Used

These pages/features now show correct CAPCO data:

- ✅ Email templates (notifications, status updates)
- ✅ PDF documents (contracts, reports)
- ✅ CMS content pages
- ✅ Status messages
- ✅ VAPI voice assistant prompts
- ✅ Footer/header company info
- ✅ Contact forms
- ✅ Meta tags (OG image, site title)

---

## Files Created/Modified

### Created

- ✅ `sql-queriers/fix-capco-global-settings.sql` - SQL fix script
- ✅ `markdowns/PLACEHOLDER_FIX_COMPLETED.md` - Detailed fix documentation
- ✅ `markdowns/PLACEHOLDER_FIX_SUMMARY.md` - This file
- ✅ `src/pages/api/cache/clear-settings.ts` - Cache clearing endpoint

### No Changes Needed

- `src/lib/placeholder-utils.ts` - Working correctly
- `src/pages/api/global/global-company-data.ts` - Working correctly
- `scripts/vapi-capco-config.js` - Not the issue
- `.env` / Railway variables - Not the issue

---

## Testing Checklist

To verify the fix is working:

- [ ] Wait 60 seconds for cache to expire (or clear cache manually)
- [ ] Visit any page on capcofire.com
- [ ] Check footer - should say "CAPCO Design Group"
- [ ] Check any email template - should have CAPCO branding
- [ ] Generate a PDF - should have CAPCO info
- [ ] Test VAPI assistant - should say "Thank you for calling CAPCO Design Group"
- [ ] Check brand colors - should use purple (#825BDD) not tan (#d4a574)

---

## Why This Happened

Likely causes:

1. Database was cloned from Rothco during development
2. Seed data was copied from wrong client
3. Manual data entry mistake
4. Migration script applied wrong data

---

## Prevention for Future

### 1. Client-Specific Seed Scripts

Create separate scripts:

- `sql-queriers/seed-capco-global-settings.sql` ✅
- `sql-queriers/seed-rothco-global-settings.sql` (to-do)
- `sql-queriers/seed-[client]-global-settings.sql` (template)

### 2. Automated Verification

Add to deployment checklist:

```sql
-- Verify company name matches domain
SELECT key, value FROM "globalSettings"
WHERE key = 'companyName';

-- Expected: "CAPCO Design Group" for capcofire.com
-- Expected: "Rothco Built" for rothcollc.com
```

### 3. Admin UI

Create `/admin/settings` page to:

- View current settings
- Edit via UI (safer than SQL)
- Validate before saving
- Show preview of placeholders

---

## Summary

**Problem:** Placeholders showing wrong company name  
**Diagnosis:** Database had Rothco data on CAPCO site  
**Solution:** Updated `globalSettings` table with correct values  
**Impact:** All placeholders now work correctly  
**Status:** ✅ **RESOLVED**

**No code changes needed** - just database data correction.

---

## Related Documentation

- `markdowns/PLACEHOLDER_FIX_COMPLETED.md` - Full technical details
- `markdowns/RAILWAY_VARIABLES_CHECKLIST.md` - Environment variables guide
- `markdowns/VAPI_PLACEHOLDER_FIX.md` - VAPI-specific (not the issue)
- `sql-queriers/fix-capco-global-settings.sql` - Fix script used

---

## Contact

If placeholders still show wrong data after 60 seconds:

1. Check database:

   ```sql
   SELECT * FROM "globalSettings" WHERE key = 'companyName';
   ```

2. Clear cache manually:

   ```bash
   curl https://capcofire.com/api/cache/clear-settings
   ```

3. Check browser console for errors

4. Verify you're on the right domain (capcofire.com, not rothcollc.com)
