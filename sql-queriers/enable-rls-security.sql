-- =====================================================
-- ENABLE RLS SECURITY: Fix for "Data is publicly accessible via API"
-- Run this in Supabase SQL Editor to secure your database
-- =====================================================

-- STEP 1: Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop any existing conflicting policies
DROP POLICY IF EXISTS "profiles_all_own" ON profiles;
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

-- STEP 3: Create PROFILES table policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
);

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
);

-- Admins can insert profiles (for staff creation)
CREATE POLICY "Admins can insert profiles" ON profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles admin_profile
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.role IN ('Admin', 'Staff')
  )
);

-- STEP 4: Create PROJECTS table policies
-- Users can insert their own projects
CREATE POLICY "projects_insert_own" ON projects
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can see their own projects, admins can see all
CREATE POLICY "projects_select_own_or_admin" ON projects
FOR SELECT USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- Users can update their own projects, admins can update all
CREATE POLICY "projects_update_own_or_admin" ON projects
FOR UPDATE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- Users can delete their own projects, admins can delete all
CREATE POLICY "projects_delete_own_or_admin" ON projects
FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- STEP 5: Create FILES table policies
-- Admins full access to files
CREATE POLICY "Admins full access to files" ON files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- Clients can view own files
CREATE POLICY "Clients can view own files" ON files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'Client'
  ) AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = files.project_id 
    AND projects.author_id = auth.uid()
  )
);

-- STEP 6: Create INVOICES table policies
-- Admins full access to invoices
CREATE POLICY "Admins full access to invoices" ON invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- Clients can view own invoices
CREATE POLICY "Clients can view own invoices" ON invoices
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'Client'
  ) AND EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = invoices.project_id 
    AND projects.author_id = auth.uid()
  )
);

-- STEP 7: Create INVOICE_LINE_ITEMS table policies
-- Admins full access to invoice line items
CREATE POLICY "Admins full access to invoice_line_items" ON invoice_line_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Admin', 'Staff')
  )
);

-- Clients can view own invoice line items
CREATE POLICY "Clients can view own invoice_line_items" ON invoice_line_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'Client'
  ) AND EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_line_items.invoice_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = invoices.project_id 
      AND projects.author_id = auth.uid()
    )
  )
);

-- STEP 8: Verify the setup
SELECT 'RLS Security Enabled Successfully!' as status;

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
