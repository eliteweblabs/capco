-- ============================================================
-- STORAGE BUCKET RESTRUCTURE (FIXED VERSION)
-- ============================================================
-- This script creates a proper bucket structure for different content types
-- Each content type gets its own bucket for better organization and security

-- ==============================================
-- 1. DROP EXISTING POLICIES IF THEY EXIST
-- ==============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "discussions_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "discussions_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "discussions_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "discussions_delete_authenticated" ON storage.objects;

DROP POLICY IF EXISTS "documents_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "documents_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_authenticated" ON storage.objects;

DROP POLICY IF EXISTS "project_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "project_media_delete_authenticated" ON storage.objects;

DROP POLICY IF EXISTS "profiles_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "profiles_delete_authenticated" ON storage.objects;

-- ==============================================
-- 2. CREATE CONTENT-SPECIFIC BUCKETS
-- ==============================================

-- Discussion files bucket (IMAGES + DOCUMENTS + CAD for collaboration)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'discussions',
  'discussions', 
  false,
  52428800, -- 50MB limit (increased for CAD files)
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    -- Documents for collaboration
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    -- AutoCAD file types for collaboration
    'application/acad',
    'application/x-acad',
    'application/autocad',
    'application/x-autocad',
    'application/dwg',
    'application/x-dwg',
    'image/vnd.dwg',
    'drawing/dwg',
    'application/dxf',
    'application/x-dxf',
    'image/vnd.dxf',
    'drawing/dxf',
    'application/dwt',
    'application/x-dwt',
    'application/dws',
    'application/x-dws',
    'application/dwf',
    'application/x-dwf',
    'model/vnd.dwf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Documents bucket (DOCUMENTS + AutoCAD ONLY)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents', 
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    -- AutoCAD file types
    'application/acad',
    'application/x-acad',
    'application/autocad',
    'application/x-autocad',
    'application/dwg',
    'application/x-dwg',
    'image/vnd.dwg',
    'drawing/dwg',
    'application/dxf',
    'application/x-dxf',
    'image/vnd.dxf',
    'drawing/dxf',
    'application/dwt',
    'application/x-dwt',
    'application/dws',
    'application/x-dws',
    'application/dwf',
    'application/x-dwf',
    'model/vnd.dwf',
    -- Generic binary type for CAD files that browsers can't identify
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Project media bucket (MEDIA FILES ONLY)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media', 
  false,
  20971520, -- 20MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'audio/mp3',
    'audio/wav',
    'audio/m4a'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Profile images bucket (PROFILE IMAGES ONLY)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles', 
  false,
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 3. UPDATE FILES TABLE TO INCLUDE BUCKET INFO
-- ==============================================

-- Add bucket column to files table if it doesn't exist
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS bucket_name TEXT DEFAULT 'project-documents';

-- Add target_location and target_id for better organization
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS target_location TEXT; -- 'discussion', 'project', 'profile', etc.

ALTER TABLE files 
ADD COLUMN IF NOT EXISTS target_id INTEGER; -- discussion_id, project_id, profile_id, etc.

-- ==============================================
-- 4. CREATE STORAGE POLICIES FOR NEW BUCKETS
-- ==============================================

-- DISCUSSIONS BUCKET POLICIES
CREATE POLICY "discussions_insert_authenticated" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'discussions' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "discussions_select_authenticated" ON storage.objects
FOR SELECT USING (
  bucket_id = 'discussions' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "discussions_update_authenticated" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'discussions' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "discussions_delete_authenticated" ON storage.objects
FOR DELETE USING (
  bucket_id = 'discussions' AND
  auth.role() = 'authenticated'
);

-- DOCUMENTS BUCKET POLICIES
CREATE POLICY "documents_insert_authenticated" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "documents_select_authenticated" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "documents_update_authenticated" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "documents_delete_authenticated" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- PROJECT-MEDIA BUCKET POLICIES
CREATE POLICY "project_media_insert_authenticated" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_select_authenticated" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_update_authenticated" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "project_media_delete_authenticated" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'
);

-- PROFILES BUCKET POLICIES
CREATE POLICY "profiles_insert_authenticated" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "profiles_select_authenticated" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "profiles_update_authenticated" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "profiles_delete_authenticated" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profiles' AND
  auth.role() = 'authenticated'
);

-- ==============================================
-- 5. CREATE INDEXES FOR NEW COLUMNS
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_files_bucket_name ON files(bucket_name);
CREATE INDEX IF NOT EXISTS idx_files_target_location ON files(target_location);
CREATE INDEX IF NOT EXISTS idx_files_target_id ON files(target_id);
CREATE INDEX IF NOT EXISTS idx_files_bucket_target ON files(bucket_name, target_location, target_id);
