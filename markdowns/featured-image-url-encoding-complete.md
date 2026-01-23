# Featured Image URL Encoding - Complete Implementation Summary

## Issue Summary

Featured images were breaking when filenames contained spaces or special characters because:
1. File upload API wasn't sanitizing filenames before storage
2. SQL trigger wasn't URL-encoding paths when constructing public URLs
3. This caused broken image links in the frontend

## Complete Solution

### Changes Made

#### 1. File Upload API (`/src/pages/api/files/upload.ts`)

**Lines ~149-159**: Added comprehensive filename sanitization

```typescript
const safeFileName = fileName
  .replace(/\s+/g, '-')           // Replace spaces with hyphens
  .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscores
  .replace(/_{2,}/g, '_')          // Collapse multiple underscores
  .replace(/-{2,}/g, '-')          // Collapse multiple hyphens
  .replace(/^[-_]+|[-_]+$/g, '');  // Remove leading/trailing hyphens/underscores
```

**Benefits:**
- Prevents future uploads from having problematic filenames
- Consistent with `/src/lib/media.ts` and `/src/pages/api/admin/media.ts`
- Readable filenames (hyphens instead of percent-encoding)

#### 2. SQL Trigger (`/sql-queriers/fix-featured-image-url-encoding.sql`)

**Function**: `sync_featured_image_data()`

Updated to properly URL-encode file paths when constructing `publicUrl`:

```sql
concat(
    'https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/',
    regexp_replace(f."bucketName", '([^a-zA-Z0-9\-_.])', E'%\\1', 'g'),
    '/',
    regexp_replace(
        regexp_replace(f."filePath", ' ', '%20', 'g'),
        '([^a-zA-Z0-9\-_.~/])', 
        E'%\\1', 
        'g'
    )
)
```

**Benefits:**
- Fixes existing files with spaces/special characters in database
- Automatically fixes URLs when featured images are set/changed
- Backfills all existing projects with corrected URLs

#### 3. Diagnostic Query (`/sql-queriers/check-files-with-url-issues.sql`)

Created query to identify files with problematic paths:
- Lists all files with spaces or special characters
- Shows which projects have featured images affected
- Provides counts of affected files

## Migration Process

### Step 1: Check for Affected Files

```bash
# Run diagnostic query in Supabase SQL Editor
cat sql-queriers/check-files-with-url-issues.sql
```

This will show:
- How many files have spaces or special characters
- Which projects are using those files as featured images
- The specific file paths that need fixing

### Step 2: Apply SQL Migration

```bash
# Via Supabase CLI
supabase db execute < sql-queriers/fix-featured-image-url-encoding.sql

# Or copy/paste into Supabase Dashboard SQL Editor
```

The migration will:
1. Drop old trigger functions
2. Create new functions with URL encoding
3. Recreate triggers
4. **Automatically backfill all existing projects** with corrected URLs

### Step 3: Verify Fix

1. **Check Backend**: Run diagnostic query again - should show 0 issues in `featuredImageData`
2. **Check Frontend**: Visit pages with featured images:
   - Home page: `/` (FeaturedProjects component)
   - Project pages: `/project/[id]` (HeroProject component)
3. **Upload Test**: Upload a file with spaces (e.g., "test image.jpg") and set as featured
4. **Inspect URLs**: Check browser dev tools to confirm URLs are properly encoded

## Technical Details

### URL Encoding Strategy

**For New Uploads** (TypeScript):
- Sanitize filenames before storage
- Replace spaces with hyphens
- Replace special characters with underscores
- Results in clean, readable filenames that are URL-safe

**For Existing Files** (PostgreSQL):
- URL-encode paths when generating public URLs
- Two-pass regex replacement:
  1. Replace spaces with `%20`
  2. Encode other special characters as `%XX`
- Preserves forward slashes in paths

### Why Two Different Approaches?

1. **New uploads use sanitization** - Best practice is to avoid special characters entirely
2. **Existing files use URL encoding** - Can't rename files already in storage (would break existing references)

### Consistency Across Codebase

All upload endpoints now use the same sanitization pattern:
- `/src/pages/api/files/upload.ts` ✅ (just updated)
- `/src/lib/media.ts` ✅ (already implemented)
- `/src/pages/api/admin/media.ts` ✅ (already implemented)

Pattern: `fileName.replace(/[^a-zA-Z0-9.-]/g, "_")` with additional space handling

## Files Modified

1. **Upload API**: `/src/pages/api/files/upload.ts`
   - Added filename sanitization

2. **SQL Migration**: `/sql-queriers/fix-featured-image-url-encoding.sql` (NEW)
   - Updated trigger function with URL encoding
   - Backfills existing projects

3. **Diagnostic Query**: `/sql-queriers/check-files-with-url-issues.sql` (NEW)
   - Identifies affected files

4. **Documentation**: `/markdowns/featured-image-url-encoding-fix.md` (NEW)
   - Detailed explanation and migration guide

## Components That Use Featured Images

These components automatically benefit from the fix (no changes needed):

1. **FeaturedProjects.astro** (`/src/components/common/`)
   - Shows featured projects on home page
   - Uses `project.featuredImageData.publicUrl`

2. **HeroProject.astro** (`/src/components/common/`)
   - Shows project hero with featured image
   - Uses `project.featuredImageData.publicUrl`

3. **ProjectItem.astro** (`/src/components/project/`)
   - Shows project cards
   - Uses `project.featuredImageData.publicUrl`

4. **FileManager.astro** (`/src/components/project/`)
   - File upload and management
   - Already validates URLs and shows warnings for broken links

## Testing Checklist

### Pre-Migration Tests
- [ ] Run diagnostic query to see current state
- [ ] Note which projects have featured images with spaces
- [ ] Take screenshots of broken images (if any)

### Post-Migration Tests
- [ ] Run diagnostic query again - confirm 0 issues
- [ ] Visit home page - confirm featured projects display correctly
- [ ] Visit affected project pages - confirm featured images load
- [ ] Upload new file with spaces in name
- [ ] Set new file as featured image
- [ ] Confirm new featured image displays correctly
- [ ] Check browser console for any URL errors
- [ ] Inspect network tab - confirm 200 OK for image requests

### Edge Cases to Test
- [ ] File with multiple consecutive spaces: "my    image.jpg"
- [ ] File with apostrophe: "client's image.jpg"
- [ ] File with parentheses: "image (1).jpg"
- [ ] File with unicode: "café.jpg"
- [ ] Very long filename (>100 chars)

## Monitoring and Maintenance

### How to Check for Issues

Regular monitoring query:
```sql
-- Check if any new files have problematic paths
SELECT COUNT(*) as issue_count
FROM files
WHERE "filePath" ~ '[^a-zA-Z0-9/\-_.]'
AND "uploadedAt" > NOW() - INTERVAL '7 days';
```

Should return 0 if sanitization is working correctly.

### If Issues Recur

1. **Check upload endpoint**: Ensure filename sanitization is still in place
2. **Check trigger**: Verify SQL trigger is still active
3. **Run backfill**: Execute the UPDATE statement from the migration
4. **Check logs**: Look for file upload errors in Supabase logs

## Rollback Plan

If issues arise after migration:

```sql
-- Restore previous trigger (without URL encoding)
-- NOTE: This will restore broken URLs for files with spaces
\i sql-queriers/ensure-complete-featured-image-trigger.sql
```

Better alternative: Fix specific issue rather than full rollback

## Future Improvements

### Short Term
1. Add client-side validation in file upload UI to reject files with problematic names
2. Show warning to users when uploading files with special characters
3. Add admin tool to scan and report file URL issues

### Long Term
1. Consider migrating existing files to clean filenames
2. Implement consistent filename sanitization utility function
3. Add automated tests for file uploads with various filename patterns
4. Document file naming best practices for users

## Support and Troubleshooting

### Common Issues

**Q: Featured images still broken after migration**
- A: Check if trigger was created successfully: `\df sync_featured_image_data`
- A: Manually run backfill: Run UPDATE statement from migration file

**Q: New uploads still have spaces in filename**
- A: Check if code changes were deployed
- A: Verify `/api/files/upload` is using sanitization

**Q: Some images work, others don't**
- A: Run diagnostic query to identify which files are affected
- A: May need to run refresh function: `SELECT refresh_project_featured_image_data(PROJECT_ID);`

### Debug Commands

```sql
-- Check if trigger exists
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE '%featured_image%';

-- Check if function exists
\df sync_featured_image_data

-- Check specific project's featured image data
SELECT 
    id, 
    title, 
    "featuredImageId",
    "featuredImageData"
FROM projects 
WHERE id = YOUR_PROJECT_ID;

-- Manually refresh a specific project
SELECT refresh_project_featured_image_data(YOUR_PROJECT_ID);
```

## Related Documentation

- [Button Templates Implementation](./button-templates-implementation.md)
- [Featured Image Trigger Fix](./featured-image-trigger-fix.md)
- Database schema: `sql-queriers/ensure-complete-featured-image-trigger.sql`
