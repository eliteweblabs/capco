-- =====================================================
-- SECURE RLS POLICIES: Non-recursive approach
-- This avoids infinite recursion while maintaining security
-- =====================================================

-- STEP 1: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_select_own_or_admin" ON projects;
DROP POLICY IF EXISTS "projects_update_own_or_admin" ON projects;
DROP POLICY IF EXISTS "projects_delete_own_or_admin" ON projects;

DROP POLICY IF EXISTS "Admins full access to files" ON files;
DROP POLICY IF EXISTS "Clients can view own files" ON files;

DROP POLICY IF EXISTS "Admins full access to invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can view own invoices" ON invoices;

DROP POLICY IF EXISTS "Admins full access to invoice_line_items" ON invoice_line_items;
DROP POLICY IF EXISTS "Clients can view own invoice_line_items" ON invoice_line_items;

-- STEP 3: Create SIMPLE, NON-RECURSIVE policies using JWT data
-- These policies use auth.jwt() to get user role directly, avoiding table queries

-- PROFILES table policies - Use JWT metadata for admin check
CREATE POLICY "profiles_own_access" ON profiles
FOR ALL USING (
  auth.uid() = id OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
);

-- PROJECTS table policies - Use JWT metadata for admin check
CREATE POLICY "projects_own_or_admin" ON projects
FOR ALL USING (
  auth.uid() = author_id OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
);

-- FILES table policies - Use JWT metadata for admin check
CREATE POLICY "files_own_or_admin" ON files
FOR ALL USING (
  auth.uid() = author_id OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
);

-- INVOICES table policies - Use JWT metadata for admin check
CREATE POLICY "invoices_own_or_admin" ON invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = invoices.project_id 
    AND projects.author_id = auth.uid()
  ) OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
);

-- INVOICE_LINE_ITEMS table policies - Use JWT metadata for admin check
CREATE POLICY "invoice_line_items_own_or_admin" ON invoice_line_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM invoices 
    JOIN projects ON projects.id = invoices.project_id
    WHERE invoices.id = invoice_line_items.invoice_id 
    AND projects.author_id = auth.uid()
  ) OR
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
);

-- STEP 4: Create a function to update user role in JWT metadata
-- This function can be called when a user's role changes
CREATE OR REPLACE FUNCTION update_user_role_metadata(user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE auth.users 
  SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE id = user_id;
$$;

-- STEP 5: Alternative approach - Use email-based admin detection for immediate setup
-- This is useful if you haven't set up JWT metadata yet
DROP POLICY IF EXISTS "profiles_email_admin" ON profiles;
CREATE POLICY "profiles_email_admin" ON profiles
FOR ALL USING (
  auth.uid() = id OR
  auth.jwt() ->> 'email' LIKE '%@capcofire.com' OR
  auth.jwt() ->> 'email' IN ('admin@yourcompany.com', 'owner@yourcompany.com')
);

-- Update projects policy to also use email-based admin detection
DROP POLICY IF EXISTS "projects_email_admin" ON projects;
CREATE POLICY "projects_email_admin" ON projects
FOR ALL USING (
  auth.uid() = author_id OR
  auth.jwt() ->> 'email' LIKE '%@capcofire.com' OR
  auth.jwt() ->> 'email' IN ('admin@yourcompany.com', 'owner@yourcompany.com')
);

-- STEP 6: Verify the setup
SELECT 'Secure RLS Policies Applied Successfully!' as status;

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
  AND schemaname = 'public'
ORDER BY tablename;

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('profiles', 'projects', 'files', 'invoices', 'invoice_line_items')
GROUP BY tablename
ORDER BY tablename;

-- Show a sample of policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename IN ('profiles', 'projects')
ORDER BY tablename, policyname;
