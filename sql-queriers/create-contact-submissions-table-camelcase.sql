-- Create contactSubmissions table for storing contact form data with camelCase columns
CREATE TABLE IF NOT EXISTS contactSubmissions (
  id SERIAL PRIMARY KEY,
  projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  address VARCHAR(500),
  projectType VARCHAR(50),
  message TEXT NOT NULL,
  files TEXT[], -- Array to store file paths
  submittedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contactSubmissions_projectId ON contactSubmissions(projectId);
CREATE INDEX IF NOT EXISTS idx_contactSubmissions_email ON contactSubmissions(email);
CREATE INDEX IF NOT EXISTS idx_contactSubmissions_submittedAt ON contactSubmissions(submittedAt);

-- Add RLS policies
ALTER TABLE contactSubmissions ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all contact submissions
CREATE POLICY "Admins can view all contact submissions" ON contactSubmissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

-- Policy for admins to insert contact submissions
CREATE POLICY "Admins can insert contact submissions" ON contactSubmissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

-- Policy for admins to update contact submissions
CREATE POLICY "Admins can update contact submissions" ON contactSubmissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

-- Policy for admins to delete contact submissions
CREATE POLICY "Admins can delete contact submissions" ON contactSubmissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    )
  );

-- Allow anonymous users to insert contact submissions (for the contact form)
CREATE POLICY "Anonymous users can insert contact submissions" ON contactSubmissions
  FOR INSERT WITH CHECK (true);

-- Add trigger for updatedAt
CREATE OR REPLACE FUNCTION update_contact_submissions_updatedAt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contactSubmissions_updatedAt
  BEFORE UPDATE ON contactSubmissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updatedAt();

-- Create storage bucket for contact files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-files', 'contact-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for contact files
CREATE POLICY "Contact files are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'contact-files');

CREATE POLICY "Anyone can upload contact files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contact-files');

CREATE POLICY "Anyone can update contact files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'contact-files');

CREATE POLICY "Anyone can delete contact files" ON storage.objects
  FOR DELETE USING (bucket_id = 'contact-files');
