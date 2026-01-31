# Fix: CMS Pages Duplication Issue

## Problem
CMS pages are being duplicated, and when you delete one, it deletes both copies.

## Root Cause
There was an **inconsistency** in how pages were queried between different operations:

### GET Request (Lines 54-56)
```typescript
// Shows BOTH global (clientId = null) AND client-specific pages
if (clientId) {
  query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
}
```

### POST Request - Check for Existing (Lines 167-171) **BEFORE FIX**
```typescript
// Only checked for EXACT clientId match
if (clientId) {
  query = query.eq("clientId", clientId);
} else {
  query = query.is("clientId", null);
}
```

### DELETE Request (Lines 289-295) **BEFORE FIX**
```typescript
// Only deleted pages with EXACT clientId match
if (clientId) {
  deleteQuery = deleteQuery.eq("clientId", clientId);
} else {
  deleteQuery = deleteQuery.is("clientId", null);
}
```

## The Duplication Flow

1. **First Save**: Page created with `clientId = null` (global page)
2. **Second Save**: 
   - POST checks: "Does page exist with MY clientId?"
   - Answer: No (only finds global version with `clientId = null`)
   - Action: Creates NEW page with your specific clientId
   - Result: **Two pages with same slug exist**

3. **On GET**:
   - Query shows BOTH pages (global AND client-specific)
   - Orders by clientId DESC (client-specific first)
   - Result: You see duplicates in the list

4. **On DELETE**:
   - Query only deletes page with EXACT clientId match
   - If you delete the client-specific one, global remains
   - If you delete the global one, client-specific remains
   - Result: Appears that "both deleted" because UI refetches and shows the remaining one

## The Fix

### Fixed POST - Check for Existing (Lines 164-182)
```typescript
// Use same OR logic as GET to find either global or client-specific page
let query = supabaseAdmin.from("cmsPages").select("*").eq("slug", slug);

if (clientId) {
  query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
}

const { data: existingPages, error: queryError } = await query.order("clientId", {
  ascending: false,
}); // Client-specific takes priority

// Get the highest priority page (client-specific over global)
const existingPage = existingPages && existingPages.length > 0 ? existingPages[0] : null;
```

**Result**: POST now FINDS existing pages (either global or client-specific) and UPDATES them instead of creating duplicates.

### Fixed DELETE (Lines 287-297)
```typescript
// Delete BOTH global and client-specific pages with this slug
let deleteQuery = supabaseAdmin.from("cmsPages").delete().eq("slug", slug);

if (clientId) {
  deleteQuery = deleteQuery.or(`clientId.is.null,clientId.eq.${clientId}`);
}
```

**Result**: DELETE now removes ALL pages with the slug (both global and client-specific).

## Clean Up Existing Duplicates

Run this SQL script in Supabase:
```bash
# File: sql-queriers/remove-cms-duplicate-pages.sql
```

The script will:
1. Show you which pages are duplicated
2. Remove global pages where client-specific versions exist
3. Verify no duplicates remain

## Testing the Fix

### Test 1: Create Page
1. Go to CMS admin
2. Create a new page with slug "test-page"
3. Save it
4. Check database - should only have ONE row

### Test 2: Update Page
1. Edit the "test-page"
2. Change content and save
3. Check database - should still only have ONE row (same ID)

### Test 3: Delete Page
1. Delete "test-page"
2. Check database - should have ZERO rows for that slug

### Test 4: Multi-Environment
If you have multiple deployments (different `RAILWAY_PROJECT_NAME`):
1. Create page on Deployment A
2. Check Deployment B - should NOT see that page
3. Create same slug on Deployment B
4. Each deployment now has its own version (different clientId)

## Database Constraints

The table has this constraint:
```sql
CONSTRAINT unique_slug_per_client UNIQUE (slug, client_id)
```

This means:
- ✅ Can have ONE page with slug "home" and clientId = NULL (global)
- ✅ Can have ONE page with slug "home" and clientId = "CAPCO Design Group"
- ❌ Cannot have TWO pages with slug "home" and SAME clientId

The fix ensures we UPDATE existing pages instead of trying to create duplicates.

## Files Modified

1. ✅ `src/pages/api/cms/pages.ts` - Fixed POST and DELETE logic
2. ✅ `sql-queriers/remove-cms-duplicate-pages.sql` - Cleanup script

## Next Steps

1. **Review the changes** in `src/pages/api/cms/pages.ts`
2. **Run cleanup SQL** in Supabase to remove existing duplicates
3. **Test** creating/updating/deleting pages
4. **Deploy** the fix to production

```bash
git add src/pages/api/cms/pages.ts sql-queriers/remove-cms-duplicate-pages.sql
git commit -m "Fix CMS pages duplication - use consistent query logic"
git push
```
