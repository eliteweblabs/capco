-- Simpler approach: Add client_visible boolean column
-- True = clients can see this status, False = admin/staff only

ALTER TABLE project_statuses 
ADD COLUMN client_visible BOOLEAN DEFAULT true;

-- Set client visibility for existing statuses
UPDATE project_statuses SET client_visible = true WHERE code IN (0, 10, 20, 30, 220); -- Client workflow
UPDATE project_statuses SET client_visible = false WHERE code IN (40, 50, 60, 70, 80, 90, 100, 110); -- Admin workflow

-- Show results
SELECT code, name, client_visible, description FROM project_statuses ORDER BY code;
