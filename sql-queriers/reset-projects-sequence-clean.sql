-- Reset the projects table and sequence cleanly
-- WARNING: This will delete ALL projects and reset the sequence

-- 1. Delete all projects (including the system project)
DELETE FROM projects;

-- 2. Reset the sequence to start from 1
ALTER SEQUENCE projects_id_seq RESTART WITH 1;

-- 3. Verify the sequence is reset
SELECT last_value FROM projects_id_seq;

-- 4. Re-insert the system project with id=0 (if needed)
INSERT INTO projects (id, title, address, description, author_id, status, sq_ft, new_construction, created_at, updated_at)
VALUES (0, 'System', 'System Activities', 'System project for logging global activities', '00000000-0000-0000-0000-000000000000', 0, 0, false, NOW(), NOW());

-- 5. Set the sequence to start from 1 (so new projects get id=1, 2, 3, etc.)
SELECT setval('projects_id_seq', 1, false);

-- 6. Final verification
SELECT last_value FROM projects_id_seq;
SELECT id, title, address FROM projects ORDER BY id;
