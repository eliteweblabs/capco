-- =====================================================
-- DISABLE PROJECT_STATUSES RLS (RECOMMENDED)
-- Project statuses are configuration data that can be publicly readable
-- This eliminates the performance issue entirely
-- =====================================================

-- Disable RLS on project_statuses table since it's just configuration data
ALTER TABLE project_statuses DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename = 'project_statuses'
  AND schemaname = 'public';

SELECT 'Project statuses RLS disabled - performance issue resolved!' as status;
