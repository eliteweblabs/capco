-- Check the exact structure of the projects table
-- This will help identify if the company_name column still exists

-- Check all columns in projects table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Check if there are any constraints on the projects table
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'projects'
ORDER BY constraint_name;

-- Check if there are any indexes on the projects table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects'
ORDER BY indexname;
