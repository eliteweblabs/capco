# Quick Reference: Featured Image URL Fix

## Problem
Featured images breaking due to spaces and special characters in filenames.

## Solution Files

1. **Code Fix**: `/src/pages/api/files/upload.ts` (lines 149-159)
   - Sanitizes filenames on upload

2. **Database Fix**: `/sql-queriers/fix-featured-image-url-encoding.sql`
   - Updates SQL trigger to URL-encode paths
   - Backfills existing data

3. **Migration Script**: `/scripts/fix-featured-image-urls.sh`
   - Automated migration process

4. **Diagnostic Query**: `/sql-queriers/check-files-with-url-issues.sql`
   - Identifies affected files

## Quick Migration

### Option 1: Automated (Recommended)
```bash
./scripts/fix-featured-image-urls.sh
```

### Option 2: Manual
```bash
# 1. Check current state
supabase db execute < sql-queriers/check-files-with-url-issues.sql

# 2. Apply fix
supabase db execute < sql-queriers/fix-featured-image-url-encoding.sql

# 3. Verify
supabase db execute < sql-queriers/check-files-with-url-issues.sql
```

### Option 3: Supabase Dashboard
1. Open Supabase Dashboard → SQL Editor
2. Copy content from `sql-queriers/fix-featured-image-url-encoding.sql`
3. Paste and run
4. Check results

## What Changed

### New Filename Format
**Before**: `1234567890-abc123-my project image.jpg` (spaces preserved)
**After**: `1234567890-abc123-my-project-image.jpg` (hyphens and underscores)

### URL Encoding
**Before**: `https://.../my project image.jpg` (broken)
**After**: `https://.../my%20project%20image.jpg` (working)

## Testing

### Quick Test
1. Upload file named "test image.jpg"
2. Set as featured image for a project
3. Visit home page or project page
4. Image should display correctly

### Check Logs
```sql
-- Should return 0 after migration
SELECT COUNT(*) FROM files 
WHERE "filePath" ~ '[^a-zA-Z0-9/\-_.]';
```

## Troubleshooting

### Images still broken?
```sql
-- Manually refresh a project
SELECT refresh_project_featured_image_data(YOUR_PROJECT_ID);

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%featured_image%';
```

### Need help?
See complete documentation in `/markdowns/featured-image-url-encoding-complete.md`

## Rollback (if needed)
```sql
-- Restore previous trigger (note: won't fix broken URLs)
\i sql-queriers/ensure-complete-featured-image-trigger.sql
```
