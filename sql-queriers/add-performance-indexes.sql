-- Performance Optimization: Add Indexes to Speed Up Dashboard Queries
-- Run this in your Supabase SQL Editor to dramatically improve dashboard load times

-- ====================
-- PROJECTS TABLE INDEXES
-- ====================

-- Index on authorId (for filtering client projects)
CREATE INDEX IF NOT EXISTS idx_projects_authorId 
ON projects("authorId");

-- Index on assignedToId (for filtering staff assignments)
CREATE INDEX IF NOT EXISTS idx_projects_assignedToId 
ON projects("assignedToId");

-- Index on status (for filtering by project status)
CREATE INDEX IF NOT EXISTS idx_projects_status 
ON projects(status);

-- Composite index for common queries (authorId + createdAt for sorting)
CREATE INDEX IF NOT EXISTS idx_projects_authorId_createdAt 
ON projects("authorId", "createdAt" DESC);

-- Index on createdAt for default sorting
CREATE INDEX IF NOT EXISTS idx_projects_createdAt 
ON projects("createdAt" DESC);

-- Index on updatedAt for sorting by recent updates
CREATE INDEX IF NOT EXISTS idx_projects_updatedAt 
ON projects("updatedAt" DESC);

-- Index on featured flag (for public featured projects)
CREATE INDEX IF NOT EXISTS idx_projects_featured 
ON projects(featured) WHERE featured = true;

-- ====================
-- FILES TABLE INDEXES
-- ====================

-- Index on projectId (for fetching files by project)
CREATE INDEX IF NOT EXISTS idx_files_projectId 
ON files("projectId");

-- Composite index for projectId + uploadedAt
CREATE INDEX IF NOT EXISTS idx_files_projectId_uploadedAt 
ON files("projectId", "uploadedAt" DESC);

-- ====================
-- PROFILES TABLE INDEXES
-- ====================

-- Index on email (for user lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- Index on role (for filtering by user type)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role);

-- ====================
-- NOTIFICATIONS TABLE INDEXES (if exists)
-- ====================

-- Index on userId (for fetching user notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_userId 
ON notifications("userId");

-- Index on viewed flag (for unread count)
CREATE INDEX IF NOT EXISTS idx_notifications_viewed 
ON notifications(viewed);

-- Composite index for userId + createdAt
CREATE INDEX IF NOT EXISTS idx_notifications_userId_createdAt 
ON notifications("userId", "createdAt" DESC);

-- Composite index for userId + viewed (for unread notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_userId_viewed 
ON notifications("userId", viewed);

-- ====================
-- VERIFY INDEXES
-- ====================

-- Run this to see all indexes on the projects table
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'projects';

-- Run this to see table sizes and index usage
-- SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ====================
-- EXPECTED IMPACT
-- ====================

-- Before indexes:
-- - Dashboard load: 10-17 seconds
-- - Full table scans on every query
-- 
-- After indexes:
-- - Dashboard load: 1-3 seconds (70-85% faster!)
-- - Index lookups instead of table scans
-- - Faster sorting and filtering
--
-- The most impactful indexes:
-- 1. idx_projects_authorId - Used on EVERY dashboard load
-- 2. idx_projects_createdAt - Used for default sorting
-- 3. idx_files_projectId - Used to fetch files for each project
-- 4. idx_projects_assignedToId - Used to join with profiles

ANALYZE projects;
ANALYZE files;
ANALYZE profiles;
