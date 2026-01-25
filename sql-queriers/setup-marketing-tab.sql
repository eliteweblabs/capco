-- Marketing Tab Database Setup
-- This script ensures the database schema supports the Marketing tab functionality

-- 1. Add featuredImageId column to projects table if it doesn't exist
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS "featuredImageId" INTEGER;

-- 2. Add comment for documentation
COMMENT ON COLUMN projects."featuredImageId" IS 'References files.id for the project''s featured marketing image stored in project-marketing bucket';

-- 3. Verify files table has required columns (should already exist)
-- These are needed for marketing image storage:
-- - id (integer, primary key)
-- - projectId (integer, foreign key to projects)
-- - fileName (text)
-- - filePath (text)
-- - fileType (text)
-- - bucketName (text) -- Should be 'project-marketing' for marketing images
-- - targetLocation (text) -- Should be 'marketing' for marketing images
-- - publicUrl (text) -- Public URL for accessing the image
-- - authorId (uuid)
-- - uploadedAt (timestamp)
-- - title (text)
-- - comments (text)
-- - isPrivate (boolean)

-- 4. Create index on featuredImageId for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_featured_image_id 
ON projects("featuredImageId");

-- 5. Create index on files for marketing queries
CREATE INDEX IF NOT EXISTS idx_files_marketing_lookup 
ON files(project_id, bucket_name, target_location) 
WHERE bucket_name = 'project-marketing' AND target_location = 'marketing';

-- 6. Verify RLS policies for marketing bucket (informational - adjust as needed)
-- Note: RLS policies should allow:
-- - Authenticated users to INSERT/UPDATE/DELETE their own project's marketing files
-- - Public READ access to marketing files (since they're in public portfolio)

-- Example RLS policy for files table (adjust to your needs):
/*
-- Allow authenticated users to insert marketing files for their projects
CREATE POLICY "Users can insert marketing files for their projects"
ON files FOR INSERT
TO authenticated
WITH CHECK (
  bucket_name = 'project-marketing' 
  AND target_location = 'marketing'
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = files.project_id 
    AND (projects.author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    ))
  )
);

-- Allow authenticated users to update marketing files for their projects
CREATE POLICY "Users can update marketing files for their projects"
ON files FOR UPDATE
TO authenticated
USING (
  bucket_name = 'project-marketing' 
  AND target_location = 'marketing'
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = files.project_id 
    AND (projects.author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    ))
  )
);

-- Allow authenticated users to delete marketing files for their projects
CREATE POLICY "Users can delete marketing files for their projects"
ON files FOR DELETE
TO authenticated
USING (
  bucket_name = 'project-marketing' 
  AND target_location = 'marketing'
  AND EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = files.project_id 
    AND (projects.author_id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Admin', 'Staff')
    ))
  )
);

-- Allow everyone to read marketing files (they're public)
CREATE POLICY "Anyone can read marketing files"
ON files FOR SELECT
TO public
USING (
  bucket_name = 'project-marketing' 
  AND target_location = 'marketing'
);
*/

-- 7. Supabase Storage Bucket Setup (run in Supabase Dashboard Storage section)
-- Bucket name: project-marketing
-- Public: TRUE
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif
-- Max file size: 10MB
-- File path: {projectId}/marketing/{fileName}

-- Note: Storage policies should allow:
-- - Authenticated users to upload to their project folders
-- - Public read access to all files
-- Example storage policies:
/*
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload marketing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-marketing' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their files
CREATE POLICY "Users can delete their marketing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-marketing' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access
CREATE POLICY "Public read access for marketing images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-marketing');
*/

-- 8. Verification queries
-- Run these to verify setup:

-- Check if featuredImageId column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'featuredImageId';

-- Count projects with featured images
SELECT 
  COUNT(*) as total_projects,
  COUNT("featuredImageId") as projects_with_featured_images
FROM projects;

-- List all marketing files
SELECT 
  f.id,
  f.project_id,
  f.file_name,
  f.public_url,
  p.address as project_address,
  p."featuredImageId" = f.id as is_featured
FROM files f
LEFT JOIN projects p ON p.id = f.project_id
WHERE f.bucket_name = 'project-marketing' 
  AND f.target_location = 'marketing'
ORDER BY f.project_id, f.uploaded_at DESC;

-- Verify featured projects have accessible images
SELECT 
  p.id,
  p.address,
  p.featured,
  p."featuredImageId",
  f.file_name,
  f.public_url
FROM projects p
LEFT JOIN files f ON f.id = p."featuredImageId"
WHERE p.featured = true
ORDER BY p.id;
