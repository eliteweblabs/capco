# Marketing Tab Implementation

## Overview
Implemented a new Marketing tab for project management that separates public-facing marketing images from internal project documents.

## Problem Solved
Previously, the featured image toggle in the Files tab was trying to use images from the private `project-media` bucket, which resulted in 404 errors when displaying in the public portfolio. The system was attempting to access URLs like:
```
https://qudlxlryegnainztkrtk.supabase.co/storage/v1/object/public/project-media/13/documents/...
```
These URLs were failing because `project-media` is a private bucket.

## Solution
Created a dedicated Marketing tab with a separate public bucket (`project-marketing`) for all public-facing content.

## Changes Made

### 1. Removed Featured Toggle from FileManager.astro
- **File**: `/src/components/project/FileManager.astro`
- **Lines Removed**: 542-562 (Featured toggle section)
- **Lines Modified**: 1234-1322 (Removed featured image update logic from saveFileDetails)
- The Files tab now only handles internal project documents

### 2. Created TabMarketing.astro Component
- **File**: `/src/components/project/TabMarketing.astro`
- **Purpose**: Manage public-facing marketing content
- **Features**:
  - Featured image selector with visual preview
  - Gallery image management with drag & drop upload
  - Star icon to set any image as featured
  - Delete functionality for marketing images
  - Uses public bucket `project-marketing` for all uploads
  - Stores images in `/marketing` location within the bucket

### 3. Added Marketing Tab to Navigation
- **File**: `/src/pages/project/[id].astro`
- **Changes**:
  - Added import for `TabMarketing`
  - Added "marketing" to validTabs array
  - Added Marketing tab navigation item (Admin/Staff only, with palette icon)
  - Added TabMarketing component to tab content section

### 4. Updated ProjectPortfolio.astro
- **File**: `/src/components/common/ProjectPortfolio.astro`
- **Changes**:
  - Modified to fetch featured images from `project-marketing` bucket
  - Added async image fetching for each project's featured image
  - Updated image rendering to use direct public URL instead of lazy loading
  - Proper error handling for missing images

## How It Works

### Workflow for Setting Featured Images:
1. Admin/Staff navigates to project → Marketing tab
2. Upload marketing images (stored in public `project-marketing` bucket)
3. Click star icon on desired image to set as featured
4. Click "Save Marketing Content" to persist the featured image ID to the project
5. Featured image now displays in ProjectPortfolio component on public pages

### Data Storage:
- **Marketing Images**: Stored in `project-marketing` bucket (public) at `/projectId/marketing/`
- **Project Reference**: `projects.featuredImageId` stores the file ID from `files` table
- **Files Table**: Contains reference with `bucketName='project-marketing'` and `targetLocation='marketing'`

### API Endpoints Used:
- `GET /api/files/get?projectId={id}&targetLocation=marketing&bucketName=project-marketing` - Fetch marketing images
- `POST /api/files/upload` - Upload new marketing images
- `POST /api/files/delete` - Delete marketing images
- `PUT /api/projects/upsert` - Update project's featuredImageId
- `GET /api/projects/get?featured=true` - Fetch featured projects for portfolio

## Testing Checklist

### Prerequisites:
- [ ] Ensure Supabase bucket `project-marketing` exists and is set to PUBLIC
- [ ] Verify RLS policies allow authenticated users to read/write to marketing bucket
- [ ] Confirm project has `featuredImageId` column (nullable integer)

### Test Steps:
1. **Upload Marketing Images**
   - [ ] Navigate to a project → Marketing tab
   - [ ] Upload 2-3 high-quality images
   - [ ] Verify images appear in gallery grid
   - [ ] Check that public URLs are accessible in browser

2. **Set Featured Image**
   - [ ] Click star icon on one image
   - [ ] Verify featured image preview appears at top
   - [ ] Click "Save Marketing Content"
   - [ ] Verify success message appears

3. **Verify Portfolio Display**
   - [ ] Navigate to portfolio/projects page
   - [ ] Verify featured image displays correctly (no 404)
   - [ ] Verify image loads without blur/lazy loading issues
   - [ ] Test category filtering works correctly

4. **Test Delete Functionality**
   - [ ] Delete a non-featured marketing image
   - [ ] Verify it's removed from gallery
   - [ ] Try to delete the featured image
   - [ ] Verify featured preview updates correctly

5. **Test Multiple Projects**
   - [ ] Set featured images for 3+ different projects
   - [ ] Mark all as featured in project settings
   - [ ] Verify portfolio shows all projects with correct images
   - [ ] Test filter functionality (All/New Construction/Renovation)

## File Locations

### New Files:
- `/src/components/project/TabMarketing.astro` - Marketing tab component

### Modified Files:
- `/src/components/project/FileManager.astro` - Removed featured toggle
- `/src/pages/project/[id].astro` - Added Marketing tab
- `/src/components/common/ProjectPortfolio.astro` - Updated image fetching

## Future Enhancements

### Potential Improvements:
1. **Batch Operations**: Add ability to upload multiple images at once with progress indicator
2. **Image Optimization**: Automatically resize/compress images on upload
3. **Gallery Order**: Allow drag-to-reorder gallery images
4. **Image Metadata**: Add caption/alt text fields for SEO
5. **Project Microsite**: Generate a dedicated public page per project
6. **PDF Generation**: Integrate marketing images into project PDF exports
7. **Image Cropping**: Add in-browser crop tool for featured images
8. **Analytics**: Track which project images get the most engagement

## Database Schema Reference

### projects table:
```sql
-- Add if not exists:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS featuredImageId INTEGER;
```

### files table (existing):
```sql
-- Already has:
id INTEGER PRIMARY KEY
projectId INTEGER
fileName TEXT
filePath TEXT
fileType TEXT
bucketName TEXT
targetLocation TEXT
publicUrl TEXT
-- ... other fields
```

## Notes

- Marketing images are completely separate from document files
- The Files tab continues to work as before for project documents
- Only Admin/Staff can access the Marketing tab (clientHide: true)
- Images in marketing bucket are publicly accessible without authentication
- Featured image ID is stored at project level, not file level
- If featured image is deleted, portfolio will show placeholder image

## Troubleshooting

### Images showing 404:
- Verify bucket name is `project-marketing` (not `project-media`)
- Check bucket is set to PUBLIC in Supabase dashboard
- Verify RLS policies allow public read access

### Featured image not updating:
- Check browser console for API errors
- Verify featuredImageId is being saved to projects table
- Ensure image ID exists in files table with correct bucketName

### Upload fails:
- Check file size limit (default 10MB)
- Verify only image types are being uploaded
- Check bucket storage quota in Supabase

### Portfolio not loading images:
- Verify async image fetching is completing
- Check network tab for failed requests
- Ensure Cookie header is being passed in fetch requests
