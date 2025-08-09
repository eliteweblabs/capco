-- =====================================================
-- FIX: Missing relationship between projects and profiles tables
-- This adds the missing foreign key and table structure
-- =====================================================

-- 1. First, let's check if the projects table exists
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT,
  status INTEGER DEFAULT 10,
  sq_ft INTEGER,
  new_construction BOOLEAN DEFAULT false,
  building JSONB,
  project JSONB,
  service JSONB,
  requested_docs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add missing foreign key constraint for assigned_to_id -> profiles
-- First drop the constraint if it exists to avoid errors
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_assigned_to_id_fkey;

-- Add the foreign key constraint to profiles table
ALTER TABLE projects 
ADD CONSTRAINT projects_assigned_to_id_fkey 
FOREIGN KEY (assigned_to_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for projects (if they don't exist)
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_select_own_or_admin" ON projects;
DROP POLICY IF EXISTS "projects_update_own_or_admin" ON projects;
DROP POLICY IF EXISTS "projects_delete_own_or_admin" ON projects;

-- Users can insert their own projects
CREATE POLICY "projects_insert_own" ON projects
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can see their own projects, admins can see all
CREATE POLICY "projects_select_own_or_admin" ON projects
FOR SELECT USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Users can update their own projects, admins can update all
CREATE POLICY "projects_update_own_or_admin" ON projects
FOR UPDATE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Users can delete their own projects, admins can delete all
CREATE POLICY "projects_delete_own_or_admin" ON projects
FOR DELETE USING (
  auth.uid() = author_id OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- 5. Create files table if it doesn't exist
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'active',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for files
DROP POLICY IF EXISTS "files_insert_own" ON files;
DROP POLICY IF EXISTS "files_select_own_or_admin" ON files;
DROP POLICY IF EXISTS "files_update_own_or_admin" ON files;
DROP POLICY IF EXISTS "files_delete_own_or_admin" ON files;

-- Users can insert files for their own projects
CREATE POLICY "files_insert_own" ON files
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  )
);

-- Users can see files for their own projects, admins can see all
CREATE POLICY "files_select_own_or_admin" ON files
FOR SELECT USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Users can update files for their own projects, admins can update all
CREATE POLICY "files_update_own_or_admin" ON files
FOR UPDATE USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- Users can delete files for their own projects, admins can delete all
CREATE POLICY "files_delete_own_or_admin" ON files
FOR DELETE USING (
  auth.uid() = author_id OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE id = files.project_id AND author_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Staff')
  )
);

-- 8. Test the relationships
SELECT 'Database schema setup completed successfully' as status;

-- Verify the foreign key relationships exist
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('projects', 'files')
ORDER BY tc.table_name, tc.constraint_name;
