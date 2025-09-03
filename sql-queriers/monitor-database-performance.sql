-- =====================================================
-- DATABASE PERFORMANCE MONITORING
-- Run this to check query performance and identify issues
-- =====================================================

-- 1. Check current slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 100  -- Queries taking more than 100ms on average
ORDER BY mean_time DESC 
LIMIT 20;

-- 2. Check table sizes and activity
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 3. Check index usage efficiency
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 4. Check RLS policy performance impact
SELECT 
  tablename,
  rowsecurity as "RLS_Enabled",
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Show current database connections and activity
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change,
  LEFT(query, 100) as current_query
FROM pg_stat_activity 
WHERE state != 'idle'
ORDER BY query_start;

-- 6. Check for missing indexes on foreign keys
SELECT 
  c.conname AS constraint_name,
  t.relname AS table_name,
  ARRAY_AGG(a.attname) AS columns,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f' -- Foreign key constraints
  AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid
    AND i.indkey::int[] @> c.conkey::int[]
  )
GROUP BY c.conname, t.relname, c.oid
ORDER BY t.relname;

-- 7. Check cache hit ratios
SELECT 
  'Buffer Cache Hit Ratio' as metric,
  ROUND(
    100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2
  ) as percentage
FROM pg_stat_database
UNION ALL
SELECT 
  'Index Cache Hit Ratio' as metric,
  ROUND(
    100.0 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2
  ) as percentage
FROM pg_statio_user_indexes;

-- 8. Show table bloat estimation
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  ROUND(
    100 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename))::numeric 
    / NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0), 2
  ) as index_ratio_percent
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 9. Check for unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND idx_scan < 10  -- Indexes used less than 10 times
  AND pg_relation_size(indexname::regclass) > 1024*1024  -- Larger than 1MB
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- 10. Summary report
SELECT 'Performance Monitoring Complete' as status,
       now() as timestamp;
