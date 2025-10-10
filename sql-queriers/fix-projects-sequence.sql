-- Check current sequence value
SELECT last_value FROM projects_id_seq;

-- Get the maximum ID currently in the projects table
SELECT MAX(id) as max_id FROM projects;

-- Reset the sequence to be higher than the maximum existing ID
-- This ensures new projects get unique IDs
SELECT setval('projects_id_seq', (SELECT MAX(id) + 1 FROM projects), false);

-- Verify the sequence is now set correctly
SELECT last_value FROM projects_id_seq;
