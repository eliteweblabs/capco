-- Create project_statuses table
CREATE TABLE IF NOT EXISTS project_statuses (
  id SERIAL PRIMARY KEY,
  status_code INTEGER UNIQUE NOT NULL,
  status_name VARCHAR(100) NOT NULL,
  email_content TEXT,
  est_time VARCHAR(50),
  email_client BOOLEAN DEFAULT FALSE,
  email_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial status data with email triggers
INSERT INTO project_statuses (status_code, status_name, email_content, est_time, email_client, email_staff) VALUES
  (10, 'Specs Received', 'Your project specifications have been received and are being reviewed by our team.', '1-2 business days', TRUE, FALSE),
  (20, 'Generating Proposal', 'We are currently generating your detailed proposal based on the specifications provided.', '3-5 business days', TRUE, FALSE),
  (30, 'Proposal Shipped', 'Your proposal has been completed and sent to you for review.', '1 business day', TRUE, TRUE),
  (40, 'Proposal Viewed', 'We can see you have viewed the proposal. Please let us know if you have any questions.', '1-2 business days', FALSE, TRUE),
  (50, 'Proposal Signed Off', 'Thank you for signing off on the proposal. We will now proceed with the next phase.', '1 business day', TRUE, TRUE),
  (60, 'Generating Deposit Invoice', 'We are preparing your deposit invoice for the approved proposal.', '1-2 business days', TRUE, FALSE),
  (70, 'Deposit Invoice Shipped', 'Your deposit invoice has been sent. Please review and process payment.', '1 business day', TRUE, TRUE),
  (80, 'Deposit Invoice Viewed', 'We can see you have viewed the deposit invoice. Please let us know if you have any questions.', '1-2 business days', FALSE, TRUE),
  (90, 'Deposit Invoice Paid', 'Thank you for the deposit payment. We will now begin the detailed design phase.', '1 business day', TRUE, TRUE),
  (100, 'Generating Submittals', 'We are preparing detailed submittal documents for your project.', '5-7 business days', TRUE, FALSE),
  (110, 'Submittals Shipped', 'Your submittal documents have been completed and sent for review.', '1 business day', TRUE, TRUE),
  (120, 'Submittals Viewed', 'We can see you have viewed the submittals. Please let us know if you have any questions.', '1-2 business days', FALSE, TRUE),
  (130, 'Submittals Signed Off', 'Thank you for signing off on the submittals. We will now proceed with the final deliverables.', '1 business day', TRUE, TRUE),
  (140, 'Generating Final Invoice', 'We are preparing your final invoice for the completed project.', '1-2 business days', TRUE, FALSE),
  (150, 'Final Invoice Shipped', 'Your final invoice has been sent. Please review and process payment.', '1 business day', TRUE, TRUE),
  (160, 'Final Invoice Viewed', 'We can see you have viewed the final invoice. Please let us know if you have any questions.', '1-2 business days', FALSE, TRUE),
  (170, 'Final Invoice Paid', 'Thank you for the final payment. We will now prepare your final deliverables.', '1 business day', TRUE, TRUE),
  (180, 'Generating Final Deliverables', 'We are preparing your final project deliverables and documentation.', '3-5 business days', TRUE, FALSE),
  (190, 'Stamping Final Deliverables', 'We are applying professional stamps and certifications to your final deliverables.', '1-2 business days', TRUE, FALSE),
  (200, 'Final Deliverables Shipped', 'Your final project deliverables have been completed and sent to you.', '1 business day', TRUE, TRUE),
  (210, 'Final Deliverables Viewed', 'We can see you have viewed the final deliverables. Please let us know if you have any questions.', '1-2 business days', FALSE, TRUE),
  (220, 'Project Complete', 'Congratulations! Your project has been successfully completed. Thank you for choosing CAPCo Fire Protection.', 'N/A', TRUE, TRUE)
ON CONFLICT (status_code) DO UPDATE SET
  status_name = EXCLUDED.status_name,
  email_content = EXCLUDED.email_content,
  est_time = EXCLUDED.est_time,
  email_client = EXCLUDED.email_client,
  email_staff = EXCLUDED.email_staff,
  updated_at = NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_statuses_status_code ON project_statuses(status_code);

-- Add RLS policies
ALTER TABLE project_statuses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read statuses
CREATE POLICY "Allow authenticated users to read project statuses" ON project_statuses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to update statuses
CREATE POLICY "Allow admins to update project statuses" ON project_statuses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Allow admins to insert statuses
CREATE POLICY "Allow admins to insert project statuses" ON project_statuses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  ); 