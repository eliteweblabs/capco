# Featured Image Trigger Fix

## Problem

When `featuredImageId` was being set on a project, it was only storing the file ID but not automatically populating `featuredImageData` with the complete file information including the `publicUrl`.

## Root Cause

The database trigger `sync_featured_image_data()` was not deployed to the database. This trigger is responsible for automatically populating the `featuredImageData` JSONB column whenever `featuredImageId` changes.

## Solution

Applied the migration `ensure_complete_featured_image_trigger.sql` which:

1. **Created the trigger function** `sync_featured_image_data()` that:
   - Runs automatically when `featuredImageId` is updated or inserted
   - Fetches all file metadata from the `files` table
   - Populates `featuredImageData` with a JSONB object containing:
     - `id`: File ID
     - `fileName`: Original file name
     - `filePath`: Storage path
     - `fileType`: MIME type
     - `fileSize`: File size in bytes
     - `bucketName`: Supabase storage bucket name
     - `uploadedAt`: Upload timestamp
     - `title`: File title
     - `comments`: File comments
     - `publicUrl`: Full public URL (automatically constructed)

2. **Created two triggers**:
   - `trigger_sync_featured_image_data`: Fires on UPDATE of `featuredImageId`
   - `trigger_sync_featured_image_data_insert`: Fires on INSERT when `featuredImageId` is set

3. **Backfilled existing data**: Updated all projects that had `featuredImageId` set but were missing or had incomplete `featuredImageData`

4. **Created helper function** `refresh_project_featured_image_data(project_id)`: Allows manual refresh of featured image data for a specific project

## How It Works

### Automatic Sync

When you update a project's `featuredImageId`:

```typescript
// In media.ts or any API
await supabase
  .from("projects")
  .update({ featuredImageId: fileId })
  .eq("id", projectId);
```

The trigger automatically:
1. Detects the change in `featuredImageId`
2. Queries the `files` table for the complete file record
3. Builds a JSONB object with all file metadata
4. Populates `featuredImageData` before the update completes
5. Constructs the `publicUrl` using the bucket name and file path

### Manual Refresh

If needed, you can manually refresh featured image data:

```sql
SELECT refresh_project_featured_image_data(123);
```

## Benefits

1. **Performance**: No need to join with `files` table when displaying projects - all data is in `featuredImageData`
2. **Consistency**: Trigger ensures data is always in sync
3. **Simplicity**: Frontend code can directly access `project.featuredImageData.publicUrl`
4. **Automatic**: No application code changes needed

## Verification

After the fix:
- All projects with `featuredImageId` now have complete `featuredImageData`
- Setting `featuredImageId` automatically populates `featuredImageData` with publicUrl
- Clearing `featuredImageId` automatically clears `featuredImageData`

## Files Affected

- `sql-queriers/ensure-complete-featured-image-trigger.sql`: Migration file
- `src/lib/media.ts`: Sets `featuredImageId` (trigger handles the rest)
- `src/components/common/HeroProject.astro`: Uses `project.featuredImageData.publicUrl`
- `src/components/common/FeaturedProjects.astro`: Uses `project.featuredImageData.publicUrl`

## Migration Applied

Date: 2026-01-23
Migration: `ensure_complete_featured_image_trigger`

The trigger is now active in the database and will handle all future updates automatically.
