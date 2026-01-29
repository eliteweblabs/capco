-- Test query speed - Run this in Supabase Query Editor
-- Time how long it takes

-- Simple update (should be instant, ~50ms)
UPDATE projects 
SET "dueDate" = NOW()
WHERE id = 23;

-- Simple select (should be instant, ~50ms)
SELECT * FROM projects WHERE id = 23;

-- Select all with joins (should be <500ms for 2 projects)
SELECT 
  p.*,
  author.id as author_id,
  author."firstName" as author_first_name,
  COUNT(f.id) as file_count
FROM projects p
LEFT JOIN profiles author ON p."authorId" = author.id
LEFT JOIN files f ON f."projectId" = p.id
GROUP BY p.id, author.id, author."firstName"
LIMIT 50;
