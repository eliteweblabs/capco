-- Restore foreign key constraint between invoices and projects
ALTER TABLE invoices 
ADD CONSTRAINT invoices_projectid_fkey 
FOREIGN KEY ("projectId") REFERENCES projects(id) 
ON DELETE CASCADE;
