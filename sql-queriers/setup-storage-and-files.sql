-- =====================================================
-- SETUP STORAGE AND FILES: Complete setup for PDF uploads
-- Run this in Supabase SQL Editor to fix all upload issues
-- =====================================================

-- STEP 1: Create the files table with correct schema
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  status TEXT DEFAULT 'active',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Enable RLS on files table
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create RLS policies for files table
-- Drop existing policies to avoid conflicts
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

-- STEP 4: Create storage bucket (if it doesn't exist)
-- Note: This requires admin privileges in Supabase
-- You may need to create this manually in the Supabase Dashboard

-- STEP 5: Create storage policies for the project-documents bucket
-- These policies allow authenticated users to upload files

-- Policy for inserting files (uploading)
CREATE POLICY "Allow authenticated uploads to project-documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-documents' AND
  auth.role() = 'authenticated'
);

-- Policy for selecting files (downloading/viewing)
CREATE POLICY "Allow authenticated downloads from project-documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-documents' AND
  auth.role() = 'authenticated'
);

-- Policy for updating files
CREATE POLICY "Allow authenticated updates to project-documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-documents' AND
  auth.role() = 'authenticated'
);

-- Policy for deleting files
CREATE POLICY "Allow authenticated deletes from project-documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-documents' AND
  auth.role() = 'authenticated'
);

-- STEP 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_author_id ON files(author_id);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

-- STEP 7: Verify the setup
SELECT 'Storage and files setup completed successfully!' as status;

-- Check if files table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'files' 
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'files'
ORDER BY policyname;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND qual LIKE '%project-documents%'
ORDER BY policyname;
