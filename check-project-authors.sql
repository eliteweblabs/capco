-- Check current project authors and their roles
-- Run this in Supabase SQL Editor to see the current state

SELECT 
    p.id as project_id,
    p.title,
    p.author_id,
    pr.role as author_role,
    pr.company_name as author_company,
    pr.first_name,
    pr.last_name,
    p.created_at
FROM projects p
JOIN profiles pr ON p.author_id = pr.id
ORDER BY p.created_at DESC;

-- Count projects by author role
SELECT 
    pr.role as author_role,
    COUNT(*) as project_count
FROM projects p
JOIN profiles pr ON p.author_id = pr.id
GROUP BY pr.role
ORDER BY project_count DESC;

-- Check for any projects with non-client authors (should be 0 after fixing)
SELECT 
    COUNT(*) as non_client_authors
FROM projects p
JOIN profiles pr ON p.author_id = pr.id
WHERE pr.role != 'Client';
