-- Fix Admin/Staff users not seeing all projects
-- This script adds missing RLS policies for Admin/Staff to view ALL projects

-- Admin/Staff overrides for projects table
-- These policies allow Admin/Staff users to bypass the author_id restriction

-- Allow Admins to view all projects (most important for the current issue)
CREATE POLICY "Admins can view all projects" ON projects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to insert projects for any user
CREATE POLICY "Admins can insert any projects" ON projects
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to update any projects
CREATE POLICY "Admins can update any projects" ON projects
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Allow Admins to delete any projects
CREATE POLICY "Admins can delete any projects" ON projects
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Admin/Staff overrides for files table (for consistency)
CREATE POLICY "Admins can manage all files" ON files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Test the fix by checking what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'files') 
ORDER BY tablename, policyname;
