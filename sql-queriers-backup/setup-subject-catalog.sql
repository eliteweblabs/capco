-- =====================================================
-- SETUP SUBJECT CATALOG SYSTEM
-- Creates a catalog of reusable proposal subjects
-- =====================================================

-- Create subject catalog table
CREATE TABLE IF NOT EXISTS subject_catalog (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) DEFAULT 'General',
  usage_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subject_catalog_subject ON subject_catalog(subject);
CREATE INDEX IF NOT EXISTS idx_subject_catalog_category ON subject_catalog(category);
CREATE INDEX IF NOT EXISTS idx_subject_catalog_usage_count ON subject_catalog(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_subject_catalog_active ON subject_catalog(is_active);

-- Enable RLS
ALTER TABLE subject_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subject_catalog
-- Allow all authenticated users to read active subjects
CREATE POLICY "All users can view active subjects" ON subject_catalog
FOR SELECT USING (is_active = true);

-- Allow authenticated users to insert new subjects
CREATE POLICY "Users can create new subjects" ON subject_catalog
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update subjects they created (Admin/Staff can update all)
CREATE POLICY "Users can update their own subjects" ON subject_catalog
FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admin/Staff to delete subjects
CREATE POLICY "Admin/Staff can delete subjects" ON subject_catalog
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Insert default/popular proposal subjects
INSERT INTO subject_catalog (subject, description, category, usage_count, created_by) VALUES
  ('Fire Protection Services Proposal', 'General fire protection services proposal', 'General', 10, NULL),
  ('Fire Sprinkler System Installation', 'Proposal for fire sprinkler system installation', 'Installation', 8, NULL),
  ('Fire Alarm System Upgrade', 'Proposal for upgrading existing fire alarm systems', 'Upgrade', 6, NULL),
  ('Emergency Lighting Installation', 'Proposal for emergency lighting system installation', 'Installation', 5, NULL),
  ('Fire Safety Inspection and Maintenance', 'Proposal for ongoing fire safety inspection services', 'Maintenance', 7, NULL),
  ('Fire Suppression System Design', 'Custom fire suppression system design proposal', 'Design', 4, NULL),
  ('Fire Door Installation and Certification', 'Fire door installation and certification services', 'Installation', 3, NULL),
  ('Fire Extinguisher Service and Maintenance', 'Fire extinguisher inspection and maintenance proposal', 'Maintenance', 5, NULL),
  ('Commercial Fire Protection System', 'Comprehensive commercial fire protection proposal', 'Commercial', 6, NULL),
  ('Residential Fire Safety Solutions', 'Residential fire safety system proposal', 'Residential', 4, NULL)
ON CONFLICT (subject) DO UPDATE SET
  usage_count = subject_catalog.usage_count + 1,
  updated_at = now();

-- Create function to increment usage count when a subject is used
CREATE OR REPLACE FUNCTION increment_subject_usage(subject_text TEXT)
RETURNS void AS $$
BEGIN
  UPDATE subject_catalog 
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE subject = subject_text AND is_active = true;
  
  -- If subject doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO subject_catalog (subject, created_by, usage_count)
    VALUES (subject_text, auth.uid(), 1)
    ON CONFLICT (subject) DO UPDATE SET
      usage_count = subject_catalog.usage_count + 1,
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for popular subjects
CREATE OR REPLACE VIEW popular_subjects AS
SELECT 
  id,
  subject,
  description,
  category,
  usage_count,
  created_at
FROM subject_catalog
WHERE is_active = true
ORDER BY usage_count DESC, created_at DESC;

-- Grant permissions
GRANT SELECT ON popular_subjects TO authenticated;
GRANT EXECUTE ON FUNCTION increment_subject_usage(TEXT) TO authenticated;

-- Comments
COMMENT ON TABLE subject_catalog IS 'Catalog of reusable proposal subjects with usage tracking';
COMMENT ON COLUMN subject_catalog.usage_count IS 'Number of times this subject has been used';
COMMENT ON FUNCTION increment_subject_usage(TEXT) IS 'Increments usage count for a subject, creates if not exists';
