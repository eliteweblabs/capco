# Media Manager Public URLs

## Overview
Updated the media manager to use public URLs instead of signed URLs with tokens. This ensures that all media files are accessible without authentication tokens and the "copy link" feature provides permanent, full-size image URLs.

## Changes Made

### 1. API Files Updated
- **`src/pages/api/files/get.ts`** (2 locations)
  - Changed from `createSignedUrl(filePath, 3600)` to `getPublicUrl(filePath)`
  - Updated response to use `urlData.publicUrl` instead of `urlData.signedUrl`
  
### 2. Media Library Updated
- **`src/lib/media.ts`** (5 locations)
  - Featured image retrieval: Changed to use `getPublicUrl()`
  - Specific file retrieval: Changed to use `getPublicUrl()`
  - Multiple file retrieval: Changed to use `getPublicUrl()`
  - All references to `signedUrl` changed to `publicUrl`

### 3. Admin Media Component Updated
- **`src/components/admin/AdminMedia.astro`** (1 location)
  - Storage file URL generation: Changed to use `getPublicUrl()`

## Key Benefits

1. **Permanent URLs**: Public URLs don't expire (unlike signed URLs which expire after 1 hour)
2. **No Tokens**: URLs are clean and don't contain authentication tokens
3. **Direct Access**: Files can be accessed directly without authentication
4. **Better for Copy/Paste**: The "copy link" feature now provides permanent links
5. **Full-Size Images**: URLs reference the original full-size images without transformations

## Required Database Changes

The buckets must be configured to allow public access. Run the SQL script:
```bash
sql-queriers/setup-public-bucket-access.sql
```

## Affected Buckets
- `project-media` - Main media bucket for all project files
- Any other buckets used in the FileManager component

## Testing Checklist
- [ ] Upload a file to the media manager
- [ ] Verify the file displays correctly
- [ ] Click "copy link" and paste the URL in a new browser tab
- [ ] Verify the URL works without authentication
- [ ] Verify the URL shows the full-size image (not a thumbnail)
- [ ] Test with different file types (images, PDFs, documents)

## Rollback Plan
If issues arise, the changes can be reverted by:
1. Changing `getPublicUrl()` back to `createSignedUrl(filePath, 3600)`
2. Changing `urlData.publicUrl` back to `urlData.signedUrl`
3. Re-enabling RLS policies on the storage buckets

## Date
January 25, 2026
