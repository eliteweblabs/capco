-- Add client_status_tab column to project_statuses table
-- This column will specify which tab the client should be directed to for each status

ALTER TABLE project_statuses 
ADD COLUMN client_status_tab VARCHAR(50);

-- Add some example values for common statuses
-- You can update these based on your specific tab structure

UPDATE project_statuses 
SET client_status_tab = 'documents' 
WHERE status_code IN (10, 20); -- Statuses that require document uploads

UPDATE project_statuses 
SET client_status_tab = 'proposal' 
WHERE status_code IN (30, 40); -- Statuses that require proposal review

UPDATE project_statuses 
SET client_status_tab = 'contract' 
WHERE status_code IN (45, 50); -- Statuses that require contract signing

UPDATE project_statuses 
SET client_status_tab = 'payment' 
WHERE status_code IN (60, 70); -- Statuses that require payment

-- Add a comment to document the column
COMMENT ON COLUMN project_statuses.client_status_tab IS 'Specifies which tab the client should be directed to for this status (e.g., documents, proposal, contract, payment)';
