-- Add toast message columns to project_statuses table
-- This enables centralized toast notifications for status changes

-- Add toast message columns
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS toast_admin TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS toast_client TEXT DEFAULT '';

-- Add comments for documentation
COMMENT ON COLUMN project_statuses.toast_admin IS 'Toast message shown to admin users when this status is reached';
COMMENT ON COLUMN project_statuses.toast_client IS 'Toast message shown to client users when this status is reached';

-- Update status 10 (Specs Received) - Initial project creation
UPDATE project_statuses 
SET 
  toast_admin = 'New project created: {{PROJECT_TITLE}} by {{CLIENT_EMAIL}}',
  toast_client = 'Your project "{{PROJECT_TITLE}}" has been created successfully!'
WHERE code = 10;

-- Update status 20 (Generating Proposal) - Documents submitted
UPDATE project_statuses 
SET 
  toast_admin = 'Documents submitted for {{PROJECT_TITLE}} - generating proposal',
  toast_client = 'Documents submitted successfully! We are now generating your proposal.'
WHERE code = 20;

-- Update status 30 (Proposal Shipped) - Proposal ready
UPDATE project_statuses 
SET 
  toast_admin = 'Proposal ready for {{PROJECT_TITLE}} - sent to {{CLIENT_EMAIL}}',
  toast_client = 'Your proposal is ready! Please review and let us know if you have any questions.'
WHERE code = 30;

-- Update status 40 (Proposal Viewed) - Client viewed proposal
UPDATE project_statuses 
SET 
  toast_admin = 'Client {{CLIENT_EMAIL}} has viewed the proposal for {{PROJECT_TITLE}}',
  toast_client = 'Proposal viewed successfully!'
WHERE code = 40;

-- Update status 50 (Proposal Signed Off) - Client approved proposal
UPDATE project_statuses 
SET 
  toast_admin = 'Proposal approved for {{PROJECT_TITLE}} by {{CLIENT_EMAIL}} - generating deposit invoice',
  toast_client = 'Proposal approved! We are now generating your deposit invoice.'
WHERE code = 50;

-- Update status 60 (Generating Deposit Invoice) - Admin generating invoice
UPDATE project_statuses 
SET 
  toast_admin = 'Generating deposit invoice for {{PROJECT_TITLE}}',
  toast_client = 'We are preparing your deposit invoice.'
WHERE code = 60;

-- Update status 70 (Deposit Invoice Shipped) - Invoice ready
UPDATE project_statuses 
SET 
  toast_admin = 'Deposit invoice sent for {{PROJECT_TITLE}} to {{CLIENT_EMAIL}}',
  toast_client = 'Your deposit invoice is ready! Please review and process the payment.'
WHERE code = 70;

-- Update status 80 (Deposit Invoice Viewed) - Client viewed invoice
UPDATE project_statuses 
SET 
  toast_admin = 'Client {{CLIENT_EMAIL}} has viewed the deposit invoice for {{PROJECT_TITLE}}',
  toast_client = 'Deposit invoice viewed successfully!'
WHERE code = 80;

-- Update status 90 (Deposit Invoice Paid) - Payment received
UPDATE project_statuses 
SET 
  toast_admin = 'Payment received for {{PROJECT_TITLE}} from {{CLIENT_EMAIL}} - generating submittals',
  toast_client = 'Payment received! We are now generating your project submittals.'
WHERE code = 90;

-- Update status 100 (Generating Submittals) - Admin generating submittals
UPDATE project_statuses 
SET 
  toast_admin = 'Generating submittals for {{PROJECT_TITLE}}',
  toast_client = 'We are preparing your project submittals.'
WHERE code = 100;

-- Update status 110 (Submittals Shipped) - Submittals ready
UPDATE project_statuses 
SET 
  toast_admin = 'Submittals sent for {{PROJECT_TITLE}} to {{CLIENT_EMAIL}}',
  toast_client = 'Your project submittals are ready! Please review and approve.'
WHERE code = 110;

-- Update status 120 (Submittals Viewed) - Client viewed submittals
UPDATE project_statuses 
SET 
  toast_admin = 'Client {{CLIENT_EMAIL}} has viewed the submittals for {{PROJECT_TITLE}}',
  toast_client = 'Submittals viewed successfully!'
WHERE code = 120;

-- Update status 130 (Submittals Signed Off) - Client approved submittals
UPDATE project_statuses 
SET 
  toast_admin = 'Submittals approved for {{PROJECT_TITLE}} by {{CLIENT_EMAIL}} - generating final invoice',
  toast_client = 'Submittals approved! We are now generating your final invoice.'
WHERE code = 130;

-- Update status 140 (Generating Final Invoice) - Admin generating final invoice
UPDATE project_statuses 
SET 
  toast_admin = 'Generating final invoice for {{PROJECT_TITLE}}',
  toast_client = 'We are preparing your final invoice.'
WHERE code = 140;

-- Update status 150 (Final Invoice Shipped) - Final invoice ready
UPDATE project_statuses 
SET 
  toast_admin = 'Final invoice sent for {{PROJECT_TITLE}} to {{CLIENT_EMAIL}}',
  toast_client = 'Your final invoice is ready! Please review and process the payment.'
WHERE code = 150;

-- Update status 160 (Final Invoice Viewed) - Client viewed final invoice
UPDATE project_statuses 
SET 
  toast_admin = 'Client {{CLIENT_EMAIL}} has viewed the final invoice for {{PROJECT_TITLE}}',
  toast_client = 'Final invoice viewed successfully!'
WHERE code = 160;

-- Update status 170 (Final Invoice Paid) - Final payment received
UPDATE project_statuses 
SET 
  toast_admin = 'Final payment received for {{PROJECT_TITLE}} from {{CLIENT_EMAIL}} - generating deliverables',
  toast_client = 'Final payment received! We are now preparing your final deliverables.'
WHERE code = 170;

-- Update status 180 (Generating Final Deliverables) - Admin generating deliverables
UPDATE project_statuses 
SET 
  toast_admin = 'Generating final deliverables for {{PROJECT_TITLE}}',
  toast_client = 'We are preparing your final deliverables.'
WHERE code = 180;

-- Update status 190 (Stamping Final Deliverables) - Admin stamping deliverables
UPDATE project_statuses 
SET 
  toast_admin = 'Stamping final deliverables for {{PROJECT_TITLE}}',
  toast_client = 'Your final deliverables are being stamped and prepared.'
WHERE code = 190;

-- Update status 200 (Final Deliverables Shipped) - Deliverables ready
UPDATE project_statuses 
SET 
  toast_admin = 'Final deliverables sent for {{PROJECT_TITLE}} to {{CLIENT_EMAIL}}',
  toast_client = 'Your final deliverables are ready!'
WHERE code = 200;

-- Update status 210 (Final Deliverables Viewed) - Client viewed deliverables
UPDATE project_statuses 
SET 
  toast_admin = 'Client {{CLIENT_EMAIL}} has viewed the final deliverables for {{PROJECT_TITLE}}',
  toast_client = 'Final deliverables viewed successfully!'
WHERE code = 210;

-- Update status 220 (Project Complete) - Project completed
UPDATE project_statuses 
SET 
  toast_admin = 'Project {{PROJECT_TITLE}} completed successfully!',
  toast_client = 'Congratulations! Your project "{{PROJECT_TITLE}}" has been completed successfully.'
WHERE code = 220;

-- Show updated table structure with toast message settings
SELECT 
  code,
  name,
  LEFT(toast_admin, 50) || '...' as toast_admin_preview,
  LEFT(toast_client, 50) || '...' as toast_client_preview
FROM project_statuses 
WHERE toast_admin IS NOT NULL OR toast_client IS NOT NULL
ORDER BY code;
