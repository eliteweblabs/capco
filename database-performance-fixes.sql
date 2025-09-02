-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION
-- Fixes for slow queries identified in monitoring
-- =====================================================

-- STEP 1: Disable RLS on project_statuses (configuration data)
-- This eliminates auth checks on every status lookup
ALTER TABLE project_statuses DISABLE ROW LEVEL SECURITY;

-- STEP 2: Create optimized indexes for frequently queried columns
-- Index on projects.author_id (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_projects_author_id ON projects(author_id);

-- Index on projects.status (used for filtering)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Index on projects.updated_at (used for ordering)
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Index on profiles.role (used in admin checks)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index on discussion.project_id (used for comment counts)
CREATE INDEX IF NOT EXISTS idx_discussion_project_id ON discussion(project_id);

-- Index on discussion.internal (used for client filtering)
CREATE INDEX IF NOT EXISTS idx_discussion_internal ON discussion(internal);

-- Composite index for discussion filtering
CREATE INDEX IF NOT EXISTS idx_discussion_project_internal ON discussion(project_id, internal);

-- Index on files.project_id (used for file queries)
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);

-- Index on files.author_id (used in RLS)
CREATE INDEX IF NOT EXISTS idx_files_author_id ON files(author_id);

-- STEP 3: Optimize RLS policies to reduce recursive queries
-- Drop existing complex policies
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can insert any projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete any projects" ON projects;

-- Create simplified admin policies using JWT metadata instead of profiles lookup
CREATE POLICY "projects_admin_full_access" ON projects
FOR ALL USING (
  -- Check JWT metadata for admin role (avoids profiles table lookup)
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
  OR
  -- Fallback: specific admin emails
  auth.jwt() ->> 'email' IN (
    'admin@capcofire.com',
    'owner@capcofire.com', 
    'staff@capcofire.com'
  )
  OR
  -- User owns the project
  auth.uid() = author_id
)
WITH CHECK (
  (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'Admin'
  OR
  auth.jwt() ->> 'email' IN (
    'admin@capcofire.com',
    'owner@capcofire.com',
    'staff@capcofire.com'
  )
  OR
  auth.uid() = author_id
);

-- STEP 4: Create a materialized view for user profiles to reduce lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS user_profiles_cache AS
SELECT 
  id,
  name,
  company_name,
  role,
  phone,
  created_at,
  -- Pre-compute display name
  COALESCE(
    company_name,
    name,
    'Unknown User'
  ) as display_name
FROM profiles;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_cache_id ON user_profiles_cache(id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_cache_role ON user_profiles_cache(role);

-- Function to refresh the cache (call this periodically)
CREATE OR REPLACE FUNCTION refresh_user_profiles_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_profiles_cache;
$$;

-- STEP 5: Create optimized functions for common queries

-- Function to get user info without RLS overhead
CREATE OR REPLACE FUNCTION get_user_display_info(user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  company_name text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    COALESCE(p.company_name, p.name, 'Unknown User') as display_name,
    p.company_name,
    p.role
  FROM profiles p
  WHERE p.id = user_id;
$$;

-- Function to get project comment counts efficiently
CREATE OR REPLACE FUNCTION get_project_comment_counts(project_ids integer[], user_role text DEFAULT 'Client')
RETURNS TABLE (
  project_id integer,
  comment_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    d.project_id,
    COUNT(*) as comment_count
  FROM discussion d
  WHERE d.project_id = ANY(project_ids)
    AND (
      user_role IN ('Admin', 'Staff') 
      OR d.internal = false
    )
  GROUP BY d.project_id;
$$;

-- STEP 6: Analyze tables to update statistics
ANALYZE projects;
ANALYZE profiles;
ANALYZE discussion;
ANALYZE files;
ANALYZE project_statuses;

-- STEP 7: Verify improvements
SELECT 'Database performance optimizations applied successfully!' as status;

-- Show current RLS status
SELECT 
  tablename,
  rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename IN ('profiles', 'projects', 'files', 'project_statuses', 'discussion')
  AND schemaname = 'public'
ORDER BY tablename;

-- Show created indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('projects', 'profiles', 'discussion', 'files')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
