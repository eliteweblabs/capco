-- Create subjects table for independent subject management
-- This decouples subjects from invoices and allows for better organization

CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_title ON subjects(title);
CREATE INDEX IF NOT EXISTS idx_subjects_category ON subjects(category);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_subjects_updated_at ON subjects;
CREATE TRIGGER trigger_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_subjects_updated_at();

-- Add RLS policies
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read subjects
CREATE POLICY "Allow authenticated users to read subjects" ON subjects
  FOR SELECT TO authenticated
  USING (true);

-- Allow only admins to insert/update/delete subjects
CREATE POLICY "Allow admins to manage subjects" ON subjects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Insert some default subjects
INSERT INTO subjects (title, description, category, created_by) VALUES
  ('Fire Protection System Design', 'Complete fire protection system design and engineering', 'Design', (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)),
  ('Fire Alarm System Installation', 'Fire alarm system installation and commissioning', 'Installation', (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)),
  ('Sprinkler System Design', 'Automatic sprinkler system design and layout', 'Design', (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)),
  ('Fire Safety Inspection', 'Comprehensive fire safety inspection and assessment', 'Inspection', (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1)),
  ('Emergency Lighting System', 'Emergency and exit lighting system design and installation', 'Installation', (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1))
ON CONFLICT DO NOTHING;
