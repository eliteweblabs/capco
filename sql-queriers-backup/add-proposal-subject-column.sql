-- =====================================================
-- VERIFY PROPOSAL SUBJECT COLUMN
-- The 'subject' column should already exist in the projects table
-- =====================================================

-- IMPORTANT: This verifies the 'subject' column exists in the projects table

-- Check if subject column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'subject'
    ) THEN
        RAISE NOTICE 'SUCCESS: subject column found in projects table';
    ELSE
        RAISE EXCEPTION 'FAILED: subject column not found in projects table. Please ensure it exists.';
    END IF;
END $$;

-- Add comment for documentation if column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'subject'
    ) THEN
        EXECUTE 'COMMENT ON COLUMN projects.subject IS ''Custom subject line for the project proposal''';
        RAISE NOTICE 'Added comment to subject column';
    END IF;
END $$;

-- Create index for better query performance if needed
CREATE INDEX IF NOT EXISTS idx_projects_subject ON projects(subject);

-- Alternatively, if you prefer a separate proposals table:
-- (Uncomment the section below if you want to create a dedicated proposals table)

/*
-- Create dedicated proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  subject TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON proposals(created_by);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for proposals
-- Users can view proposals for their own projects
CREATE POLICY "Users can view proposals for their projects" ON proposals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = proposals.project_id 
    AND author_id = auth.uid()
  )
);

-- Admins can view all proposals
CREATE POLICY "Admins can view all proposals" ON proposals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Users can create/update proposals for their projects
CREATE POLICY "Users can manage proposals for their projects" ON proposals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = proposals.project_id 
    AND author_id = auth.uid()
  )
);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proposals_updated_at 
  BEFORE UPDATE ON proposals 
  FOR EACH ROW EXECUTE FUNCTION update_proposals_updated_at();
*/

-- Verify the changes
SELECT 'Proposal subject column added successfully!' as status;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name = 'proposal_subject';
