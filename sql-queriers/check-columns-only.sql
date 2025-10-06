-- Check columns only
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name ILIKE '%projectid%' OR column_name = 'project_id';
