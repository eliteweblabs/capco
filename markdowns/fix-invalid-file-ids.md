# Fix: Prevent Files with Invalid IDs from Appearing in Media Manager

## Problem
Files with invalid or missing IDs were appearing in the media manager, causing "Invalid file ID" errors when attempting to delete them.

## Root Cause
The file APIs and frontend components were not validating that files have valid integer IDs before:
1. Returning them from API endpoints
2. Rendering them in the UI
3. Creating interactive buttons (delete, preview, etc.)

## Solution Implemented

### 1. Backend API Changes

#### `/api/admin/media.ts` (Media Manager API)
- Added `.not("id", "is", null)` filter to database queries
- Added client-side validation to filter out files where `id` is not a positive integer
- Ensures only files with valid IDs are returned to the frontend

#### `/api/files/get.ts` (Files GET API)
- Added `.not("id", "is", null)` filter to all database queries (both GET and POST methods)
- Added validation after fetching to filter out any files with invalid IDs
- Logs warnings when invalid files are filtered out

### 2. Frontend Changes

#### `FileManager.astro`
**In `loadProjectFiles()` function:**
- Added immediate filtering after API response to remove files with invalid IDs
- Logs warnings for any filtered files

**In `renderFiles()` function:**
- Added validation before rendering to ensure only files with valid IDs are displayed
- Logs warnings for any files being filtered out
- Updated to work with `validFiles` array instead of raw `files` array

**In `loadButtonPartials()` function:**
- Only loads save buttons for files with valid IDs

**In `createFileCard()` function:**
- Added safety check at the start to validate file ID
- Returns empty string (no rendering) if file ID is invalid
- Logs errors for invalid file attempts

**In `deleteFile()` function:**
- Enhanced validation to check if fileId is a valid positive integer
- Better error logging with type information

### 3. Database Cleanup

Created `/sql-queriers/cleanup-invalid-file-ids.sql`:
- Script to identify files with null or invalid IDs
- Script to identify files with missing critical fields (fileName, filePath, bucketName)
- Includes commented DELETE statements for manual cleanup

## Validation Rules

A file ID is considered **valid** if:
1. It exists (`file.id` is not null/undefined)
2. It's an integer (`Number.isInteger(file.id)`)
3. It's positive (`file.id > 0`)

## Benefits

1. **No UI Errors**: Files without valid IDs won't appear in the manager
2. **Better UX**: Users won't see delete buttons for files that can't be deleted
3. **Data Integrity**: Helps identify data quality issues through console warnings
4. **Defense in Depth**: Validation at multiple layers (API, data processing, rendering, user actions)

## Testing

To verify the fix works:
1. Check browser console for any warnings about filtered files
2. Try to find any files without delete buttons (shouldn't exist now)
3. Run the cleanup SQL script to check for database-level issues
4. All file operations (delete, preview, download) should work without "Invalid file ID" errors

## Future Improvements

Consider adding:
- Database constraints to prevent files from being created without valid IDs
- Server-side validation on file creation to ensure IDs are always assigned
- Periodic cleanup job to remove orphaned file records
