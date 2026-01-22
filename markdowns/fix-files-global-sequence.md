# filesGlobal Sequence Fix

## Issue

When uploading files through the admin media manager, the following error occurs:

```
❌ [ADMIN-MEDIA] DB insert error: {
  code: '23502',
  details: 'Failing row contains (null, heroes-IMG_7525.jpg, ...)',
  message: 'null value in column "id" of relation "filesGlobal" violates not-null constraint'
}
```

## Root Cause

The `filesGlobal` table was created with an `id` column that should auto-increment using a sequence (`files_global_id_seq`), but the sequence was either:
- Not created
- Not properly linked to the table
- Not properly initialized

## Solution

### 1. SQL Migration

Run the SQL migration to fix the sequence:

```bash
./scripts/fix-files-global-sequence.sh
```

Or manually run the SQL file:

```bash
supabase db execute -f sql-queriers/fix-files-global-sequence.sql
```

### 2. What the Fix Does

The SQL migration:
1. Creates the `files_global_id_seq` sequence if it doesn't exist
2. Links the sequence to the `id` column as its default value
3. Ensures the `id` column has a NOT NULL constraint
4. Sets the sequence to start at the max existing id + 1
5. Adds a primary key constraint on the `id` column

### 3. API Update

Updated `/src/pages/api/admin/media.ts` to:
- Return proper error responses when DB insert fails (instead of silently continuing)
- Clean up uploaded files from storage if the DB insert fails
- Provide detailed error messages to help debug issues

## Testing

After applying the fix, try uploading a file through the admin media manager. It should now work without the NULL id error.

## Prevention

The sequence should now persist and work correctly for all future inserts. The table schema is properly configured with:
- ✅ Auto-incrementing ID
- ✅ NOT NULL constraint
- ✅ Primary key constraint
- ✅ Proper default value from sequence
