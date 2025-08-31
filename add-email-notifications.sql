-- Add email notification columns to project_statuses table
-- This enables email notifications for status changes

-- Add notification columns
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS notify JSONB DEFAULT '["admin"]'::jsonb,
ADD COLUMN IF NOT EXISTS email_content TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'View Project';

-- Add comments for documentation
COMMENT ON COLUMN project_statuses.notify IS 'Array of roles to notify (admin, staff, client)';
COMMENT ON COLUMN project_statuses.email_content IS 'Email content template with placeholders';
COMMENT ON COLUMN project_statuses.button_text IS 'Text for the action button in emails';

-- Update status 20 (Generating Proposal) to notify client when documents are submitted
UPDATE project_statuses 
SET 
  notify = '["admin", "client"]'::jsonb,
  email_content = 'Your documents have been submitted successfully! We are now generating your proposal. You will be notified when it is ready for review.',
  button_text = 'View Project'
WHERE code = 20;

-- Update status 30 (Proposal Shipped) to notify client when proposal is ready
UPDATE project_statuses 
SET 
  notify = '["client"]'::jsonb,
  email_content = 'Your proposal is ready! Please review the proposal and let us know if you have any questions or would like to proceed.',
  button_text = 'Review Proposal'
WHERE code = 30;

-- Update status 40 (Proposal Viewed) to notify admin when client views proposal
UPDATE project_statuses 
SET 
  notify = '["admin"]'::jsonb,
  email_content = 'The client has viewed the proposal for {{PROJECT_TITLE}}.',
  button_text = 'View Project'
WHERE code = 40;

-- Update status 50 (Proposal Signed Off) to notify admin when client approves
UPDATE project_statuses 
SET 
  notify = '["admin"]'::jsonb,
  email_content = 'The client has approved the proposal for {{PROJECT_TITLE}}! You can now proceed with generating the deposit invoice.',
  button_text = 'View Project'
WHERE code = 50;

-- Update status 70 (Deposit Invoice Shipped) to notify client when invoice is ready
UPDATE project_statuses 
SET 
  notify = '["client"]'::jsonb,
  email_content = 'Your deposit invoice is ready! Please review and process the payment to continue with your project.',
  button_text = 'View Invoice'
WHERE code = 70;

-- Update status 90 (Deposit Invoice Paid) to notify admin when payment is received
UPDATE project_statuses 
SET 
  notify = '["admin"]'::jsonb,
  email_content = 'Payment has been received for {{PROJECT_TITLE}}! You can now proceed with generating submittals.',
  button_text = 'View Project'
WHERE code = 90;

-- Update status 110 (Submittals Shipped) to notify client when submittals are ready
UPDATE project_statuses 
SET 
  notify = '["client"]'::jsonb,
  email_content = 'Your project submittals are ready for review! Please review and approve to continue.',
  button_text = 'Review Submittals'
WHERE code = 110;

-- Update status 130 (Submittals Signed Off) to notify admin when submittals are approved
UPDATE project_statuses 
SET 
  notify = '["admin"]'::jsonb,
  email_content = 'The client has approved the submittals for {{PROJECT_TITLE}}! You can now proceed with generating the final invoice.',
  button_text = 'View Project'
WHERE code = 130;

-- Update status 150 (Final Invoice Shipped) to notify client when final invoice is ready
UPDATE project_statuses 
SET 
  notify = '["client"]'::jsonb,
  email_content = 'Your final invoice is ready! Please review and process the payment to complete your project.',
  button_text = 'View Invoice'
WHERE code = 150;

-- Update status 170 (Final Invoice Paid) to notify admin when final payment is received
UPDATE project_statuses 
SET 
  notify = '["admin"]'::jsonb,
  email_content = 'Final payment has been received for {{PROJECT_TITLE}}! You can now proceed with generating final deliverables.',
  button_text = 'View Project'
WHERE code = 170;

-- Update status 180 (Generating Final Deliverables) to notify client when deliverables are being prepared
UPDATE project_statuses 
SET 
  notify = '["client"]'::jsonb,
  email_content = 'We are preparing your final deliverables for {{PROJECT_TITLE}}. You will be notified when they are ready.',
  button_text = 'View Project'
WHERE code = 180;

-- Update status 190 (Stamping Final Deliverables) to notify client when deliverables are being stamped
UPDATE project_statuses 
SET 
  notify = '["client"]'::jsonb,
  email_content = 'Your final deliverables are being stamped and prepared for delivery.',
  button_text = 'View Project'
WHERE code = 190;

-- Update status 210 (Final Deliverables Viewed) to notify admin when client views deliverables
UPDATE project_statuses 
SET 
  notify = '["admin"]'::jsonb,
  email_content = 'The client has viewed the final deliverables for {{PROJECT_TITLE}}.',
  button_text = 'View Project'
WHERE code = 210;

-- Update status 220 (Project Complete) to notify both admin and client when project is complete
UPDATE project_statuses 
SET 
  notify = '["admin", "client"]'::jsonb,
  email_content = 'Congratulations! Your project {{PROJECT_TITLE}} has been completed successfully. Thank you for choosing our services.',
  button_text = 'View Project'
WHERE code = 220;

-- Show updated table structure with email notification settings
SELECT 
  code,
  name,
  notify,
  button_text,
  LEFT(email_content, 50) || '...' as email_content_preview
FROM project_statuses 
WHERE notify IS NOT NULL
ORDER BY code;
