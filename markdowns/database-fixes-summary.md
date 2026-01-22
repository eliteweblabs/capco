# Database Fixes and Improvements - January 22, 2026

## Summary of Changes

Fixed multiple database and API issues related to file management, camelCase compliance, and featured image toggle functionality.

---

## Issue 1: filesGlobal Upload Error ✅

### Problem
Uploading media to `admin/media` failed with:
```json
{
  "success": false,
  "error": "Failed to save file record to database",
  "details": "null value in column \"id\" of relation \"filesGlobal\" violates not-null constraint"
}
```

### Root Cause
The `filesGlobal` table was missing its auto-increment sequence (`files_global_id_seq`).

### Solution
Applied migration `fix_files_global_sequence` that:
1. Created the sequence `files_global_id_seq`
2. Set `id` column default to `nextval('files_global_id_seq'::regclass)`
3. Synced sequence value to MAX(id) + 1
4. Ensured primary key constraint

---

## Issue 2: Redundant filesGlobal Table ✅

### Problem
Two file tables existed:
- `files` (24 columns) - project files
- `filesGlobal` (9 columns) - admin/global media

This violated camelCase naming and created unnecessary complexity.

### Solution
**Consolidated into unified `files` table:**

Updated `/src/pages/api/admin/media.ts` to use `files` table with `targetLocation='global'` filter:

**Before:**
```javascript
.from("filesGlobal")
.insert({ name, fileName, ... })
```

**After:**
```javascript
.from("files")
.insert({ 
  fileName,
  targetLocation: "global",
  authorId: currentUser.id,
  ...
})
```

### Benefits
- ✅ Single unified file system
- ✅ camelCase compliance (no more `filesGlobal`)
- ✅ Global files get versioning, checkout, and privacy features
- ✅ Consistent API patterns
- ✅ Simplified maintenance

---

## Issue 3: Featured Image Toggle Not Showing ✅

### Problem
`featuredImageId` was being saved to the database, but the frontend toggle wasn't reflecting the featured status.

### Root Cause
The `/api/files/get` endpoint wasn't calculating and returning the `isFeatured` property. It returned raw file data without checking if `file.id === project.featuredImageId`.

### Solution
Updated `/src/pages/api/files/get.ts` to fetch the project's `featuredImageId` and calculate `isFeatured` for each file:

```typescript
// Fetch project's featuredImageId
let featuredImageId = null;
if (filters.projectId && files && files.length > 0) {
  const { data: projectData } = await supabaseAdmin
    .from("projects")
    .select("featuredImageId")
    .eq("id", parseInt(filters.projectId))
    .single();
  
  featuredImageId = projectData?.featuredImageId;
}

// Add isFeatured to each file
const isFeatured = featuredImageId && file.id === parseInt(featuredImageId);
```

Now the FileManager component correctly shows the toggle as checked for the featured image.

---

## Issue 4: camelCase Enforcement ⚠️

### Problem
`.cursorrules` stated "database tables and columns are always camelCase" but this wasn't consistently enforced, leading to tables like `filesGlobal` being created.

### Attempted Solution
Updated `.cursorrules` to be more explicit about camelCase requirements with clear examples and enforcement notes.

**Note:** User aborted the `.cursorrules` changes - may need to revisit this separately.

---

## Files Modified

1. **Database Migration**: Created sequence for `filesGlobal` table
2. `/src/pages/api/admin/media.ts` - Unified to use `files` table
3. `/src/pages/api/files/get.ts` - Added `isFeatured` calculation
4. `/markdowns/fix-filesGlobal-sequence.md` - Documentation
5. `/markdowns/database-cleanup-plan.md` - Migration plan
6. `/markdowns/database-fixes-summary.md` - This file

---

## Testing Checklist

- [x] Media upload to `/admin/media` works without errors
- [x] Featured image toggle shows correct state
- [x] Featured image toggle saves correctly
- [x] File list refreshes with correct featured status
- [ ] Test that global files appear in admin media manager
- [ ] Test that old `filesGlobal` table can be safely dropped
- [ ] Verify no broken references to `filesGlobal`

---

## Next Steps

### Optional: Drop filesGlobal Table
Once confirmed that all functionality works with the unified `files` table:

```sql
-- Verify no data will be lost
SELECT COUNT(*) FROM "filesGlobal";

-- If count is 0 or data has been migrated, drop the table
DROP TABLE IF EXISTS "filesGlobal" CASCADE;
DROP SEQUENCE IF EXISTS files_global_id_seq;
```

### Update .cursorrules
Revisit the camelCase enforcement rules in `.cursorrules` to prevent future violations.

---

## Key Takeaways

1. **Consistency is critical** - Having two file tables with different naming conventions caused confusion
2. **Always check sequence configuration** - Auto-increment columns need sequences with defaults
3. **Computed properties** - Fields like `isFeatured` need to be calculated from relationships, not stored
4. **camelCase matters** - Enforcing naming conventions prevents technical debt

---

## Related Documentation

- `/markdowns/fix-filesGlobal-sequence.md` - Detailed sequence fix
- `/markdowns/database-cleanup-plan.md` - Consolidation strategy
- `/sql-queriers/fix-files-global-sequence.sql` - Migration SQL
- `/sql-queriers/check-files-global-sequence.sql` - Verification queries
