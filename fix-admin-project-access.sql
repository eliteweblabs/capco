-- =====================================================
-- FIX: Ensure Admins Can Access ALL Projects
-- This script ensures Admin users can view, create, update, and delete ALL projects
-- =====================================================

-- First, let's check current policies and drop conflicting ones
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can insert any projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete any projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;

-- Admin policies for PROJECTS table
-- Allow Admins to view ALL projects (most critical for dashboard)
CREATE POLICY "Admins can view all projects" ON projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to insert projects for ANY user
CREATE POLICY "Admins can insert any projects" ON projects
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to update ANY project
CREATE POLICY "Admins can update any projects" ON projects
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to delete ANY project
CREATE POLICY "Admins can delete any projects" ON projects
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- =====================================================
-- Admin policies for FILES table (related to projects)
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all files" ON files;

-- Allow Admins to manage ALL files
CREATE POLICY "Admins can manage all files" ON files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- =====================================================
-- Verify the policies are working
-- =====================================================

-- Test query: Admin should see all projects
-- SELECT COUNT(*) as total_projects_admin_can_see FROM projects;

-- List all policies on projects table
SELECT 
  policyname, 
  cmd as operation,
  permissive,
  CASE 
    WHEN qual LIKE '%Admin%' OR qual LIKE '%Staff%' THEN 'Admin/Staff Policy'
    WHEN qual LIKE '%author_id%' THEN 'User Own Data Policy'
    ELSE 'Other Policy'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policy_type, policyname;