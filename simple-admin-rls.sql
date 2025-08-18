-- =====================================================
-- SIMPLE FIX: Basic RLS policies without recursion
-- Apply this AFTER the emergency fix if you want some security back
-- =====================================================

-- Enable RLS only on projects table (the main one you need)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create a simple admin bypass using user metadata instead of profiles table
CREATE POLICY "projects_admin_bypass" ON projects
FOR ALL 
USING (
  -- Check if user has admin role in their JWT metadata
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
  OR
  -- Fallback: check email domain (replace with your domain)
  auth.jwt() ->> 'email' LIKE '%@capcofire.com'
  OR
  -- Specific admin emails (replace with actual admin emails)
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'admin@yourcompany.com')
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
  OR
  auth.jwt() ->> 'email' LIKE '%@capcofire.com'
  OR
  auth.jwt() ->> 'email' IN ('admin@capcofire.com', 'admin@yourcompany.com')
);

-- Allow users to see their own projects
CREATE POLICY "projects_own_access" ON projects
FOR ALL 
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Test the policies
SELECT 'Simple admin policies created' as status;

-- Show current policies
SELECT 
    policyname, 
    cmd as operation
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;
