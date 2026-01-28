-- Verify Indexes Were Created and Check Query Performance

-- 1. Check if indexes exist on projects table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects'
ORDER BY indexname;

-- 2. Check if indexes exist on files table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'files'
ORDER BY indexname;

-- 3. Check if indexes exist on profiles table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'profiles'
ORDER BY indexname;

-- 4. Analyze a sample query to see if it's using indexes
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your database
EXPLAIN ANALYZE
SELECT * FROM projects 
WHERE "authorId" = 'YOUR_USER_ID_HERE'
ORDER BY "createdAt" DESC
LIMIT 50;

-- If you see "Seq Scan" in the output, the index is NOT being used
-- If you see "Index Scan" in the output, the index IS being used

-- 5. Check table statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename IN ('projects', 'files', 'profiles', 'notifications')
ORDER BY tablename;

-- 6. If indexes exist but aren't being used, force Postgres to analyze tables
ANALYZE projects;
ANALYZE files;
ANALYZE profiles;
