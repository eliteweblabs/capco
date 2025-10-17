-- Check current column names in files table
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'files'
ORDER BY column_name;
