-- Query to find the project with massive logs
SELECT 
  id,
  title,
  address,
  jsonb_array_length(log) as log_count,
  pg_column_size(log) as log_size_bytes,
  pg_size_pretty(pg_column_size(log)::bigint) as log_size
FROM projects
WHERE log IS NOT NULL
ORDER BY jsonb_array_length(log) DESC
LIMIT 5;
