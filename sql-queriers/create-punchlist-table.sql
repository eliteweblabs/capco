-- Create Punchlist Table and Related Components
-- This script creates all necessary database tables, columns, and storage setup for the punchlist feature

-- ==============================================
-- 1. CREATE PUNCHLIST TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS punchlist (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  internal BOOLEAN DEFAULT false,
  sms_alert BOOLEAN DEFAULT false,
  parent_id INTEGER REFERENCES punchlist(id) ON DELETE CASCADE,
  image_paths TEXT[] DEFAULT '{}',
  mark_completed BOOLEAN DEFAULT false,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. ADD COMMENTS TO DOCUMENT THE TABLE
-- ==============================================

COMMENT ON TABLE punchlist IS 'Stores punchlist items for projects - similar to discussions but focused on project completion tasks';
COMMENT ON COLUMN punchlist.id IS 'Primary key for punchlist items';
COMMENT ON COLUMN punchlist.project_id IS 'References the project this punchlist item belongs to';
COMMENT ON COLUMN punchlist.author_id IS 'References the user who created this punchlist item';
COMMENT ON COLUMN punchlist.message IS 'The content/description of the punchlist item';
COMMENT ON COLUMN punchlist.internal IS 'Whether this punchlist item is internal only (not visible to clients)';
COMMENT ON COLUMN punchlist.sms_alert IS 'Whether SMS alerts should be sent for this item';
COMMENT ON COLUMN punchlist.parent_id IS 'References the parent punchlist item this is replying to. NULL = top-level item';
COMMENT ON COLUMN punchlist.image_paths IS 'Array of image file paths attached to this punchlist item';
COMMENT ON COLUMN punchlist.mark_completed IS 'Whether this punchlist item has been marked as completed';
COMMENT ON COLUMN punchlist.company_name IS 'Company name of the author (denormalized for performance)';
COMMENT ON COLUMN punchlist.created_at IS 'When this punchlist item was created';
COMMENT ON COLUMN punchlist.updated_at IS 'When this punchlist item was last updated';

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Punchlist table indexes
CREATE INDEX IF NOT EXISTS idx_punchlist_project_id ON punchlist(project_id);
CREATE INDEX IF NOT EXISTS idx_punchlist_author_id ON punchlist(author_id);
CREATE INDEX IF NOT EXISTS idx_punchlist_parent_id ON punchlist(parent_id);
CREATE INDEX IF NOT EXISTS idx_punchlist_created_at ON punchlist(created_at);
CREATE INDEX IF NOT EXISTS idx_punchlist_mark_completed ON punchlist(mark_completed);
CREATE INDEX IF NOT EXISTS idx_punchlist_internal ON punchlist(internal);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_punchlist_project_completed ON punchlist(project_id, mark_completed);
CREATE INDEX IF NOT EXISTS idx_punchlist_project_internal ON punchlist(project_id, internal);

-- ==============================================
-- 4. UPDATE STORAGE BUCKET FOR PUNCHLIST FILES
-- ==============================================

-- Add punchlist to the project-media bucket allowed paths
-- This will be handled by the existing unified media system
-- Files will be stored in: project-media/{projectId}/punchlist/{punchlistId}/

-- ==============================================
-- 5. CREATE RLS POLICIES FOR PUNCHLIST
-- ==============================================

-- Enable RLS on punchlist table
ALTER TABLE punchlist ENABLE ROW LEVEL SECURITY;

-- Policy for Admins and Staff - full access
CREATE POLICY "Admins and Staff can manage all punchlist items"
ON punchlist
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- Policy for Clients - can only see punchlist items for their own projects
-- and cannot see internal items unless they are the author
CREATE POLICY "Clients can view punchlist items for their projects"
ON punchlist
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = punchlist.project_id 
    AND projects.author_id = auth.uid()
  )
  AND (
    punchlist.internal = false 
    OR punchlist.author_id = auth.uid()
  )
);

-- Policy for Clients - can insert punchlist items for their own projects
CREATE POLICY "Clients can create punchlist items for their projects"
ON punchlist
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = punchlist.project_id 
    AND projects.author_id = auth.uid()
  )
  AND punchlist.author_id = auth.uid()
);

-- Policy for Clients - can update their own punchlist items
CREATE POLICY "Clients can update their own punchlist items"
ON punchlist
FOR UPDATE
TO authenticated
USING (punchlist.author_id = auth.uid())
WITH CHECK (punchlist.author_id = auth.uid());

-- ==============================================
-- 6. CREATE TRIGGER FOR UPDATED_AT
-- ==============================================

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for punchlist table
DROP TRIGGER IF EXISTS update_punchlist_updated_at ON punchlist;
CREATE TRIGGER update_punchlist_updated_at
    BEFORE UPDATE ON punchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 7. CREATE DEFAULT PUNCHLIST ITEMS FUNCTION
-- ==============================================

-- Function to create default punchlist items for new projects
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
    admin_user_id UUID := 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17'; -- Same admin user as discussions
BEGIN
    -- Insert default punchlist items
    INSERT INTO punchlist (project_id, author_id, message, internal, mark_completed, company_name)
    VALUES 
    (project_id_param, admin_user_id, ' Receive CAD files from client / download from <a href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Obtain fire hydrant flow test data', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Conduct design kickoff and review scope', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Coordinate with fire alarm designer', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Complete fire sprinkler layout design', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Perform hydraulic calculations', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Optimize pipe sizing for efficiency', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Add notes and leader callouts', false, false, 'CAPCo Fire'),  
    (project_id_param, admin_user_id, ' Add details and general notes', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Finalize design and apply titleblock', false, false, 'CAPCo Fire'),
    (project_id_param, admin_user_id, ' Print drawings to PDF for submittal / upload to <a href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, 'CAPCo Fire');

    RAISE NOTICE 'Created default punchlist items for project %', project_id_param;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 8. CREATE TRIGGER FOR AUTO PUNCHLIST CREATION
-- ==============================================

-- Function to automatically create default punchlist items for new projects
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the function to create default punchlist items
    PERFORM create_default_punchlist_items(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trigger_auto_create_punchlist ON projects;
CREATE TRIGGER trigger_auto_create_punchlist
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_punchlist_items();

-- ==============================================
-- 9. VERIFICATION QUERIES
-- ==============================================

-- Verify the punchlist table was created
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'punchlist' 
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'punchlist';

-- Verify RLS policies were created
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'punchlist';
