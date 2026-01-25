-- Setup Public Bucket Access for Media Manager
-- This script configures the storage buckets to allow public access
-- so that getPublicUrl() returns working URLs without authentication

-- Enable public access for project-media bucket
-- This allows files to be accessed without authentication tokens

-- First, check if the bucket is already public
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'project-media';

-- Make the project-media bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'project-media';

-- Create a policy to allow public reads on the bucket
-- This enables anyone to view/download files via public URLs
INSERT INTO storage.policies (name, bucket_id, definition, command)
SELECT 
  'Public Access for project-media',
  id,
  '{"policy": "SELECT * FROM storage.objects WHERE bucket_id = ''project-media''"}'::jsonb,
  'SELECT'
FROM storage.buckets 
WHERE name = 'project-media'
ON CONFLICT DO NOTHING;

-- Create a more permissive policy for public access (alternative approach)
-- This policy allows anyone to read all objects in the bucket
CREATE POLICY IF NOT EXISTS "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

-- Verify the bucket is now public
SELECT id, name, public, created_at, updated_at
FROM storage.buckets 
WHERE name = 'project-media';

-- List all policies for the bucket
SELECT * 
FROM storage.policies 
WHERE bucket_id IN (
  SELECT id FROM storage.buckets WHERE name = 'project-media'
);

-- Note: After running this script, all files in the project-media bucket
-- will be accessible via public URLs without authentication.
-- This is required for the media manager to work with getPublicUrl()

-- To test, use this URL format:
-- https://<your-supabase-project>.supabase.co/storage/v1/object/public/project-media/<file-path>
