-- Quick check to verify the filesGlobal sequence is working

-- Check if sequence exists
SELECT 
    'Sequence exists: ' || CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_sequences 
            WHERE schemaname = 'public' 
            AND sequencename = 'files_global_id_seq'
        ) THEN 'YES ✅'
        ELSE 'NO ❌'
    END as sequence_status;

-- Check table structure
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'filesGlobal'
AND column_name = 'id';

-- Check current sequence value
SELECT 
    'Current sequence value: ' || last_value as sequence_value
FROM files_global_id_seq;

-- Check max id in table
SELECT 
    'Max ID in table: ' || COALESCE(MAX(id), 0) as max_id
FROM "filesGlobal";

-- Check for any rows with NULL id (should be none after fix)
SELECT 
    'Rows with NULL id: ' || COUNT(*) as null_count
FROM "filesGlobal"
WHERE id IS NULL;
