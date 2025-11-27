-- Create AI Chat Images Storage Bucket
-- This bucket is public so that Claude AI can access uploaded images for analysis
-- POST /api/agent/upload-image

-- ==============================================
-- 1. CREATE AI CHAT IMAGES STORAGE BUCKET
-- ==============================================

-- Create the ai-chat-images bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-chat-images',
  'AI Chat Images', 
  true, -- Public bucket so Claude AI can access images
  10485760, -- 10MB file size limit
  ARRAY[
    -- Images only
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================
-- 2. CREATE STORAGE POLICIES FOR AI CHAT IMAGES BUCKET
-- ==============================================

-- Policy for viewing images (public read access - needed for Claude AI)
DROP POLICY IF EXISTS "AI chat images are publicly viewable" ON storage.objects;
CREATE POLICY "AI chat images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'ai-chat-images');

-- Policy for uploading images (authenticated users only)
DROP POLICY IF EXISTS "Authenticated users can upload AI chat images" ON storage.objects;
CREATE POLICY "Authenticated users can upload AI chat images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ai-chat-images' AND
    auth.role() = 'authenticated'
  );

-- Policy for updating images (users can update their own images)
DROP POLICY IF EXISTS "Users can update their own AI chat images" ON storage.objects;
CREATE POLICY "Users can update their own AI chat images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ai-chat-images' AND
    auth.role() = 'authenticated' AND
    -- Users can only update files in their own folder
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policy for deleting images (users can delete their own images)
DROP POLICY IF EXISTS "Users can delete their own AI chat images" ON storage.objects;
CREATE POLICY "Users can delete their own AI chat images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ai-chat-images' AND
    auth.role() = 'authenticated' AND
    -- Users can only delete files in their own folder
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- ==============================================
-- 3. VERIFY BUCKET CREATION
-- ==============================================

-- Check if bucket was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'ai-chat-images'
  ) THEN
    RAISE NOTICE '✅ AI Chat Images bucket created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create AI Chat Images bucket';
  END IF;
END $$;

