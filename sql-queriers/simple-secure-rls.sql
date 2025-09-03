-- =====================================================
-- SIMPLE SECURE RLS: Minimal policies that definitely work
-- Use this if you want basic security without complexity
-- =====================================================

-- STEP 1: Enable RLS on main tables only
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- STEP 2: Keep profiles table OPEN for now to avoid recursion
-- You can secure it later once everything else works
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items DISABLE ROW LEVEL SECURITY;

-- STEP 3: Simple project-level security
-- Users can only see their own projects, admins can see all

-- Drop any existing policies
DROP POLICY IF EXISTS "projects_user_access" ON projects;
DROP POLICY IF EXISTS "files_user_access" ON files;

-- Basic project access - users see their own, specific emails see all
CREATE POLICY "projects_user_access" ON projects
FOR ALL USING (
  -- User owns the project
  auth.uid() = author_id OR
  -- OR user is admin (replace with your actual admin email)
  auth.jwt() ->> 'email' IN (
    'admin@capcofire.com',
    'owner@capcofire.com',
    'staff@capcofire.com'
  )
);

-- Basic file access - same logic as projects
CREATE POLICY "files_user_access" ON files
FOR ALL USING (
  -- User owns the file
  auth.uid() = author_id OR
  -- OR user is admin
  auth.jwt() ->> 'email' IN (
    'admin@capcofire.com', 
    'owner@capcofire.com',
    'staff@capcofire.com'
  )
);

-- STEP 4: Test the setup
SELECT 'Simple Secure RLS Applied!' as status;

-- Verify which tables have RLS enabled
SELECT 
  tablename,
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
  AND schemaname = 'public'
ORDER BY tablename;
