-- Add constraint to ensure project authors are always clients
-- This provides database-level protection against invalid author assignments

-- First, let's check if there are any existing projects with non-client authors
SELECT 
    p.id as project_id,
    p.title,
    p.author_id,
    pr.role as author_role,
    pr.company_name as author_company,
    pr.first_name,
    pr.last_name
FROM projects p
JOIN profiles pr ON p.author_id = pr.id
WHERE pr.role != 'Client';

-- If there are any, we need to fix them first before adding the constraint
-- You may need to manually reassign these projects to client users

-- Add the constraint to prevent future violations
ALTER TABLE projects 
ADD CONSTRAINT check_author_is_client 
CHECK (
    author_id IN (
        SELECT id FROM profiles WHERE role = 'Client'
    )
);

-- Verify the constraint was added
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'check_author_is_client';

-- Test the constraint by trying to insert a project with a non-client author
-- This should fail:
-- INSERT INTO projects (author_id, title, address, status) 
-- VALUES ('some-admin-user-id', 'Test Project', 'Test Address', 0);

-- Note: If you need to temporarily disable this constraint for data migration:
-- ALTER TABLE projects DISABLE TRIGGER ALL;
-- ALTER TABLE projects DROP CONSTRAINT check_author_is_client;
-- ALTER TABLE projects ENABLE TRIGGER ALL;
