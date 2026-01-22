# Fix: filesGlobal Upload Error

## Problem

When uploading media to `admin/media`, users encountered the following error:

```json
{
  "success": false,
  "error": "Failed to save file record to database",
  "details": "null value in column \"id\" of relation \"filesGlobal\" violates not-null constraint"
}
```

## Root Cause

The `filesGlobal` table was created with an `id` column that:
- Was marked as NOT NULL
- Had no default value
- Was missing its associated sequence (`files_global_id_seq`)

When the API tried to insert a new record without explicitly providing an `id`, PostgreSQL would reject it because:
1. The `id` field was required (NOT NULL)
2. No default value was set to auto-generate it

## Solution

Applied migration `fix_files_global_sequence` which:

1. **Created the sequence**: `CREATE SEQUENCE IF NOT EXISTS files_global_id_seq;`
2. **Set the default value**: Configured the `id` column to use `nextval('files_global_id_seq'::regclass)`
3. **Synced sequence value**: Set the sequence to start from MAX(id) + 1 to avoid conflicts
4. **Added primary key**: Ensured `id` is the primary key (if not already set)

## Verification

After the fix, the `id` column now has:
- `column_default`: `nextval('files_global_id_seq'::regclass)`
- `is_nullable`: `NO`

This means PostgreSQL will automatically generate sequential IDs for new records.

## API Location

The affected API endpoint is:
- **File**: `src/pages/api/admin/media.ts`
- **Method**: POST (line 79-195)
- **Table**: `filesGlobal` (line 140)

## Related Files

- Migration: `supabase/migrations/fix_files_global_sequence.sql`
- Check script: `sql-queriers/check-files-global-sequence.sql`
- Fix script: `sql-queriers/fix-files-global-sequence.sql`

## Date Fixed

January 22, 2026
