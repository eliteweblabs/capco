-- Check actual project count in database
-- Run this in Supabase SQL Editor

SELECT 
    COUNT(*) as total_projects,
    COUNT(*) FILTER (WHERE id != 0) as excluding_system_log
FROM projects;

-- Show all project IDs and titles
SELECT 
    id,
    title,
    "authorId",
    "createdAt",
    status
FROM projects
WHERE id != 0
ORDER BY id;
