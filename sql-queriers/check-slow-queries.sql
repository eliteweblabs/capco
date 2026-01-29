-- Check which indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('projects', 'files', 'profiles')
ORDER BY tablename, indexname;

-- Check query performance stats
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%projects%'
ORDER BY mean_exec_time DESC
LIMIT 10;
