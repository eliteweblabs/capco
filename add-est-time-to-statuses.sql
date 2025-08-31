-- Add est_time column to project_statuses table
-- This allows each status to have its own estimated time for the {{EST_TIME}} placeholder

-- Add est_time column
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS est_time TEXT DEFAULT '2-3 business days';

-- Add comment for documentation
COMMENT ON COLUMN project_statuses.est_time IS 'Estimated time for this status (used in {{EST_TIME}} placeholder)';

-- Update status 10 (Specs Received) - Initial project creation
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 10;

-- Update status 20 (Generating Proposal) - Documents submitted
UPDATE project_statuses 
SET est_time = '3-5 business days'
WHERE code = 20;

-- Update status 30 (Proposal Shipped) - Proposal ready
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 30;

-- Update status 40 (Proposal Viewed) - Client viewed proposal
UPDATE project_statuses 
SET est_time = '2-3 business days'
WHERE code = 40;

-- Update status 50 (Proposal Signed Off) - Client approved proposal
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 50;

-- Update status 60 (Generating Deposit Invoice) - Admin generating invoice
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 60;

-- Update status 70 (Deposit Invoice Shipped) - Invoice ready
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 70;

-- Update status 80 (Deposit Invoice Viewed) - Client viewed invoice
UPDATE project_statuses 
SET est_time = '2-3 business days'
WHERE code = 80;

-- Update status 90 (Deposit Invoice Paid) - Payment received
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 90;

-- Update status 100 (Generating Submittals) - Admin generating submittals
UPDATE project_statuses 
SET est_time = '5-7 business days'
WHERE code = 100;

-- Update status 110 (Submittals Shipped) - Submittals ready
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 110;

-- Update status 120 (Submittals Viewed) - Client viewed submittals
UPDATE project_statuses 
SET est_time = '3-5 business days'
WHERE code = 120;

-- Update status 130 (Submittals Signed Off) - Client approved submittals
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 130;

-- Update status 140 (Generating Final Invoice) - Admin generating final invoice
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 140;

-- Update status 150 (Final Invoice Shipped) - Final invoice ready
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 150;

-- Update status 160 (Final Invoice Viewed) - Client viewed final invoice
UPDATE project_statuses 
SET est_time = '2-3 business days'
WHERE code = 160;

-- Update status 170 (Final Invoice Paid) - Final payment received
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 170;

-- Update status 180 (Generating Final Deliverables) - Admin generating deliverables
UPDATE project_statuses 
SET est_time = '3-5 business days'
WHERE code = 180;

-- Update status 190 (Stamping Final Deliverables) - Admin stamping deliverables
UPDATE project_statuses 
SET est_time = '2-3 business days'
WHERE code = 190;

-- Update status 200 (Final Deliverables Shipped) - Deliverables ready
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 200;

-- Update status 210 (Final Deliverables Viewed) - Client viewed deliverables
UPDATE project_statuses 
SET est_time = '1-2 business days'
WHERE code = 210;

-- Update status 220 (Project Complete) - Project completed
UPDATE project_statuses 
SET est_time = 'N/A'
WHERE code = 220;

-- Show updated table structure with est_time values
SELECT 
  code,
  name,
  est_time,
  LEFT(toast_admin, 50) || '...' as toast_admin_preview,
  LEFT(toast_client, 50) || '...' as toast_client_preview
FROM project_statuses 
ORDER BY code;
