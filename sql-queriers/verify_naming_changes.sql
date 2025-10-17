-- Verify naming convention changes

-- 1. Check for any remaining lowercase columns in files table
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'files'
AND column_name ~ '[a-z]_[a-z]|^[a-z]+$'
ORDER BY column_name;

-- 2. Verify camelCase columns exist and have correct types
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'files'
AND column_name IN (
  'checkedOutBy',
  'checkedOutAt',
  'assignedTo',
  'assignedAt',
  'checkoutNotes'
)
ORDER BY column_name;

-- 3. Verify RLS policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'files'
ORDER BY policyname;

-- 4. Check if old table was properly dropped
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'filecheckouthistory'
) as old_table_exists;

-- 5. Verify data integrity
SELECT 
    COUNT(*) as total_files,
    COUNT(DISTINCT "projectId") as unique_projects,
    COUNT(DISTINCT "authorId") as unique_authors,
    COUNT(*) FILTER (WHERE "checkedOutBy" IS NOT NULL) as checked_out_files,
    COUNT(*) FILTER (WHERE "assignedTo" IS NOT NULL) as assigned_files
FROM files;
