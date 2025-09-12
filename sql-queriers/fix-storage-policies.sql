-- Fix Storage Policies for File Upload
-- This script fixes the storage policies to properly handle file uploads

-- ==============================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- ==============================================

DROP POLICY IF EXISTS "Users can upload files to project-documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files in project-documents" ON storage.objects;

-- ==============================================
-- 2. CREATE SIMPLIFIED STORAGE POLICIES
-- ==============================================

-- Policy for uploading files - allow any authenticated user to upload
CREATE POLICY "Allow authenticated uploads to project-documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy for viewing files - allow any authenticated user to view
CREATE POLICY "Allow authenticated downloads from project-documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy for updating files - allow any authenticated user to update
CREATE POLICY "Allow authenticated updates to project-documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-documents' AND
  auth.uid() IS NOT NULL
);

-- Policy for deleting files - allow any authenticated user to delete
CREATE POLICY "Allow authenticated deletes from project-documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-documents' AND
  auth.uid() IS NOT NULL
);

-- ==============================================
-- 3. VERIFICATION
-- ==============================================

-- Check if policies were created
SELECT 'Storage Policies' as component, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_policies 
         WHERE tablename = 'objects' 
         AND schemaname = 'storage'
         AND policyname LIKE '%project-documents%'
       ) 
       THEN '✅ Created' 
       ELSE '❌ Missing' 
       END as status;

-- Check bucket exists
SELECT 'Storage Bucket' as component, 
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-documents') 
       THEN '✅ Exists' 
       ELSE '❌ Missing' 
       END as status;
