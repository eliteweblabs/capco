-- =====================================================
-- FIX PROJECT_STATUSES RLS PERFORMANCE
-- Optimizes RLS policies to avoid re-evaluating auth functions per row
-- =====================================================

-- First, check if project_statuses table has RLS enabled
SELECT 
    tablename,
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename = 'project_statuses'
  AND schemaname = 'public';

-- Show current policies on project_statuses table
SELECT 
    policyname, 
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'project_statuses'
ORDER BY policyname;

-- Drop any existing inefficient policies
DROP POLICY IF EXISTS "Allow authenticated users to read project statuses" ON project_statuses;
DROP POLICY IF EXISTS "project_statuses_read" ON project_statuses;
DROP POLICY IF EXISTS "project_statuses_select" ON project_statuses;

-- Create optimized policy that evaluates auth functions once
-- Instead of: auth.uid() IS NOT NULL (evaluated per row)
-- Use: (SELECT auth.uid()) IS NOT NULL (evaluated once)
CREATE POLICY "project_statuses_authenticated_read" ON project_statuses
FOR SELECT USING (
  -- Evaluate auth.uid() once and cache the result
  (SELECT auth.uid()) IS NOT NULL
);

-- Alternative: If you want to allow public read access to project statuses
-- (since they're just status configurations), you can disable RLS entirely:
-- ALTER TABLE project_statuses DISABLE ROW LEVEL SECURITY;

-- Verify the new policy
SELECT 'Project statuses RLS performance optimized!' as status;

-- Show updated policies
SELECT 
    policyname, 
    cmd as operation,
    qual as using_clause
FROM pg_policies 
WHERE tablename = 'project_statuses'
ORDER BY policyname;
