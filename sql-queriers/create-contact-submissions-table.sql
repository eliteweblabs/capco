-- Contact Submissions Table
-- Stores submissions from the contact form feature

CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  address TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_company ON contact_submissions(company);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can insert contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Anyone can insert contact submissions" ON contact_submissions;

-- Policy: Admins can view all contact submissions
CREATE POLICY "Admins can view all contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Policy: Anyone can submit contact forms (unauthenticated users)
-- Note: In production, you may want to add rate limiting or CAPTCHA
CREATE POLICY "Anyone can insert contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at_trigger ON contact_submissions;

CREATE TRIGGER update_contact_submissions_updated_at_trigger
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the website';
COMMENT ON COLUMN contact_submissions.first_name IS 'First name of the person submitting the form';
COMMENT ON COLUMN contact_submissions.last_name IS 'Last name of the person submitting the form';
COMMENT ON COLUMN contact_submissions.email IS 'Email address for follow-up';
COMMENT ON COLUMN contact_submissions.phone IS 'Optional phone number';
COMMENT ON COLUMN contact_submissions.company IS 'Optional company/organization name';
COMMENT ON COLUMN contact_submissions.address IS 'Optional address from Google Places autocomplete';
COMMENT ON COLUMN contact_submissions.message IS 'The main message/inquiry from the user';
COMMENT ON COLUMN contact_submissions.submitted_at IS 'When the form was submitted';
