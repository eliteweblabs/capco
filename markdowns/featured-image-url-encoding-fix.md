# Featured Image URL Encoding Fix

## Problem

Featured images were not displaying correctly when the original filename contained spaces or special characters. The URLs generated in `featuredImageData.publicUrl` were breaking because filenames weren't being properly URL-encoded.

### Example of the Issue

If a file was named `my project image.jpg`, the resulting URL would be:
```
https://...supabase.co/storage/v1/object/public/project-media/123/documents/1234567890-my project image.jpg
```

This URL is invalid because spaces aren't allowed in URLs. The correct URL should be:
```
https://...supabase.co/storage/v1/object/public/project-media/123/documents/1234567890-my%20project%20image.jpg
```

## Root Causes

1. **File Upload (`/src/pages/api/files/upload.ts`)**: When files were uploaded, the filename wasn't being URL-encoded before being saved to storage, resulting in file paths with spaces.

2. **SQL Trigger (`sync_featured_image_data()`)**: When constructing the `publicUrl` in the database trigger, the `filePath` wasn't being URL-encoded, so any spaces or special characters in the path would break the URL.

## Solutions Implemented

### 1. File Upload API Fix

**File**: `/src/pages/api/files/upload.ts` (line ~150)

**Change**: Modified filename generation to sanitize the filename before creating the storage path:

```typescript
// OLD - spaces and special characters preserved
const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${fileName}`;

// NEW - spaces and special characters sanitized
const safeFileName = fileName
  .replace(/\s+/g, '-')           // Replace spaces with hyphens
  .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscores
  .replace(/_{2,}/g, '_')          // Replace multiple underscores with single
  .replace(/-{2,}/g, '-')          // Replace multiple hyphens with single
  .replace(/^[-_]+|[-_]+$/g, '');  // Remove leading/trailing hyphens and underscores
const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${safeFileName}`;
```

This ensures:
- Spaces are replaced with hyphens (readable and URL-safe)
- Special characters are replaced with underscores
- Multiple consecutive hyphens/underscores are collapsed to single characters
- Leading/trailing hyphens and underscores are removed
- The resulting filename is consistent with other upload endpoints (`/api/admin/media.ts` and `lib/media.ts`)

### 2. SQL Trigger Fix

**File**: `/sql-queriers/fix-featured-image-url-encoding.sql`

**Change**: Updated the `sync_featured_image_data()` function to properly URL-encode the `filePath` when constructing `publicUrl`:

```sql
-- OLD - no encoding
concat('https://...supabase.co/storage/v1/object/public/', f."bucketName", '/', f."filePath")

-- NEW - proper URL encoding
concat(
    'https://...supabase.co/storage/v1/object/public/',
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

This encoding:
- Replaces spaces with `%20`
- URL-encodes any other special characters
- Preserves forward slashes `/` (needed for path structure)
- Preserves URL-safe characters (letters, numbers, hyphens, underscores, dots, tildes)

## Migration Steps

### Step 1: Run the SQL Migration

Execute the SQL migration to fix the trigger and backfill existing data:

```bash
# Via Supabase CLI
supabase db execute < sql-queriers/fix-featured-image-url-encoding.sql

# Or manually in Supabase Dashboard SQL Editor
```

The migration will:
1. Drop and recreate the `sync_featured_image_data()` function with proper encoding
2. Recreate the triggers on the `projects` table
3. Backfill all existing projects to fix their `featuredImageData.publicUrl` values
4. Update the manual refresh function

### Step 2: Verify the Fix

After running the migration:

1. **Check existing featured images** - They should now display correctly even if they had spaces in the filename
2. **Upload a new file with spaces** - e.g., "test image.jpg"
3. **Set it as featured** - The image should display correctly in FeaturedProjects.astro

### Step 3: Test the Frontend

Visit pages that display featured images:
- `/` (home page with featured projects)
- Project cards in the admin panel
- Any component using `project.featuredImageData.publicUrl`

## Files Modified

1. `/src/pages/api/files/upload.ts` - Added filename encoding during upload
2. `/sql-queriers/fix-featured-image-url-encoding.sql` - New SQL migration file

## Related Components

These components use `featuredImageData.publicUrl`:
- `/src/components/common/FeaturedProjects.astro`
- `/src/components/common/HeroProject.astro`
- `/src/components/project/ProjectItem.astro`

No changes needed in these components - they just consume the corrected URLs.

## Testing Checklist

- [ ] Run SQL migration
- [ ] Verify existing featured images load correctly
- [ ] Upload a file with spaces in the name (e.g., "my test image.jpg")
- [ ] Mark it as featured for a project
- [ ] Check that the image displays on the frontend
- [ ] Inspect the URL in browser dev tools to confirm proper encoding
- [ ] Test with other special characters (apostrophes, parentheses, etc.)

## Future Considerations

1. **Media Library Management**: Consider creating a media management interface that shows all uploaded files and validates their URLs
2. **File Naming Guidelines**: Document best practices for file naming to avoid issues
3. **Bulk URL Fix Tool**: Create an admin tool to scan and fix any remaining broken URLs in the database

## Technical Notes

### Why URL Encoding Matters

URLs cannot contain spaces or many special characters. The URL standard (RFC 3986) requires that these characters be percent-encoded:

- Space → `%20`
- Apostrophe → `%27`
- Parentheses → `%28` and `%29`
- Etc.

### PostgreSQL URL Encoding

PostgreSQL doesn't have a built-in URL encoding function, so we use regex replacements:

```sql
-- First pass: replace spaces with %20
regexp_replace(path, ' ', '%20', 'g')

-- Second pass: encode other special characters
regexp_replace(result, '([^a-zA-Z0-9\-_.~/])', E'%\\1', 'g')
```

This two-step approach ensures proper encoding while preserving path structure.

## Rollback Plan

If issues arise, you can rollback to the previous trigger version:

```bash
# Restore from the previous version
supabase db execute < sql-queriers/ensure-complete-featured-image-trigger.sql
```

Note: This will restore the old behavior (no URL encoding), so featured images with spaces will still be broken.
