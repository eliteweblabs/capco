-- Update email content to include {{ADDRESS}} placeholder for better dynamic content
-- This will make emails more personalized by including the project address

-- Update status 20 (Generating Proposal) to include address
UPDATE project_statuses 
SET 
  email_content = 'Your documents have been submitted successfully for {{PROJECT_TITLE}} at {{ADDRESS}}! We are now generating your proposal. You will be notified when it is ready for review.'
WHERE code = 20;

-- Update status 30 (Proposal Shipped) to include address
UPDATE project_statuses 
SET 
  email_content = 'Your proposal is ready for {{PROJECT_TITLE}} at {{ADDRESS}}! Please review the proposal and let us know if you have any questions or would like to proceed.'
WHERE code = 30;

-- Update status 40 (Proposal Viewed) to include address
UPDATE project_statuses 
SET 
  email_content = 'The client has viewed the proposal for {{PROJECT_TITLE}} at {{ADDRESS}}.'
WHERE code = 40;

-- Update status 50 (Proposal Signed Off) to include address
UPDATE project_statuses 
SET 
  email_content = 'The client has approved the proposal for {{PROJECT_TITLE}} at {{ADDRESS}}! You can now proceed with generating the deposit invoice.'
WHERE code = 50;

-- Update status 70 (Deposit Invoice Shipped) to include address
UPDATE project_statuses 
SET 
  email_content = 'Your deposit invoice is ready for {{PROJECT_TITLE}} at {{ADDRESS}}! Please review and process the payment to continue with your project.'
WHERE code = 70;

-- Update status 90 (Deposit Invoice Paid) to include address
UPDATE project_statuses 
SET 
  email_content = 'Payment has been received for {{PROJECT_TITLE}} at {{ADDRESS}}! You can now proceed with generating submittals.'
WHERE code = 90;

-- Update status 110 (Submittals Shipped) to include address
UPDATE project_statuses 
SET 
  email_content = 'Your project submittals are ready for review for {{PROJECT_TITLE}} at {{ADDRESS}}! Please review and approve to continue.'
WHERE code = 110;

-- Update status 130 (Submittals Signed Off) to include address
UPDATE project_statuses 
SET 
  email_content = 'The client has approved the submittals for {{PROJECT_TITLE}} at {{ADDRESS}}! You can now proceed with generating the final invoice.'
WHERE code = 130;

-- Update status 150 (Final Invoice Shipped) to include address
UPDATE project_statuses 
SET 
  email_content = 'Your final invoice is ready for {{PROJECT_TITLE}} at {{ADDRESS}}! Please review and process the payment to complete your project.'
WHERE code = 150;

-- Update status 170 (Final Invoice Paid) to include address
UPDATE project_statuses 
SET 
  email_content = 'Final payment has been received for {{PROJECT_TITLE}} at {{ADDRESS}}! You can now proceed with generating final deliverables.'
WHERE code = 170;

-- Update status 180 (Generating Final Deliverables) to include address
UPDATE project_statuses 
SET 
  email_content = 'We are preparing your final deliverables for {{PROJECT_TITLE}} at {{ADDRESS}}. You will be notified when they are ready.'
WHERE code = 180;

-- Update status 190 (Stamping Final Deliverables) to include address
UPDATE project_statuses 
SET 
  email_content = 'Your final deliverables for {{PROJECT_TITLE}} at {{ADDRESS}} are being stamped and prepared for delivery.'
WHERE code = 190;

-- Update status 210 (Final Deliverables Viewed) to include address
UPDATE project_statuses 
SET 
  email_content = 'The client has viewed the final deliverables for {{PROJECT_TITLE}} at {{ADDRESS}}.'
WHERE code = 210;

-- Show the updated email content
SELECT 
  code,
  name,
  email_content,
  notify
FROM project_statuses 
WHERE email_content IS NOT NULL 
ORDER BY code;
