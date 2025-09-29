-- Update toast messages to include EST_TIME placeholder
-- This demonstrates how to use the {{EST_TIME}} placeholder in database messages

-- Update status 20 (Generating Proposal) - Documents submitted
-- This is the example you provided
UPDATE project_statuses 
SET 
  toast_admin = 'Documents submitted for {{PROJECT_TITLE}} by {{CLIENT_EMAIL}} - generating proposal',
  toast_client = 'We have received your project documents and will begin preparing a proposal of services. We will notify you at {{CLIENT_EMAIL}} in {{EST_TIME}}.'
WHERE code = 20;

-- Update status 30 (Proposal Shipped) - Proposal ready
UPDATE project_statuses 
SET 
  toast_admin = 'Proposal ready for {{PROJECT_TITLE}} - sent to {{CLIENT_EMAIL}}',
  toast_client = 'Your proposal is ready! Please review and let us know if you have any questions. We will follow up in {{EST_TIME}} if we don\'t hear from you.'
WHERE code = 30;

-- Update status 60 (Generating Deposit Invoice) - Admin generating invoice
UPDATE project_statuses 
SET 
  toast_admin = 'Generating deposit invoice for {{PROJECT_TITLE}} - will be ready in {{EST_TIME}}',
  toast_client = 'We are preparing your deposit invoice and will have it ready in {{EST_TIME}}.'
WHERE code = 60;

-- Update status 100 (Generating Submittals) - Admin generating submittals
UPDATE project_statuses 
SET 
  toast_admin = 'Generating submittals for {{PROJECT_TITLE}} - estimated completion in {{EST_TIME}}',
  toast_client = 'We are preparing your project submittals and expect to complete them in {{EST_TIME}}.'
WHERE code = 100;

-- Update status 140 (Generating Final Invoice) - Admin generating final invoice
UPDATE project_statuses 
SET 
  toast_admin = 'Generating final invoice for {{PROJECT_TITLE}} - will be ready in {{EST_TIME}}',
  toast_client = 'We are preparing your final invoice and will have it ready in {{EST_TIME}}.'
WHERE code = 140;

-- Update status 180 (Generating Final Deliverables) - Admin generating deliverables
UPDATE project_statuses 
SET 
  toast_admin = 'Generating final deliverables for {{PROJECT_TITLE}} - estimated completion in {{EST_TIME}}',
  toast_client = 'We are preparing your final deliverables and expect to complete them in {{EST_TIME}}.'
WHERE code = 180;

-- Update status 190 (Stamping Final Deliverables) - Admin stamping deliverables
UPDATE project_statuses 
SET 
  toast_admin = 'Stamping final deliverables for {{PROJECT_TITLE}} - will be complete in {{EST_TIME}}',
  toast_client = 'Your final deliverables are being stamped and prepared. This process will be complete in {{EST_TIME}}.'
WHERE code = 190;

-- Show updated messages with EST_TIME placeholder
SELECT 
  code,
  name,
  LEFT(toast_admin, 80) || '...' as toast_admin_preview,
  LEFT(toast_client, 80) || '...' as toast_client_preview
FROM project_statuses 
WHERE toast_admin LIKE '%{{EST_TIME}}%' OR toast_client LIKE '%{{EST_TIME}}%'
ORDER BY code;
