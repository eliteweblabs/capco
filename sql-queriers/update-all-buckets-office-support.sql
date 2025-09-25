-- Comprehensive Office Document Support for All Storage Buckets
-- This script ensures all storage buckets support Office documents and other file types

-- ==============================================
-- 1. UPDATE PROJECT-MEDIA BUCKET (Primary bucket used by the app)
-- ==============================================
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Images
  'image/jpeg',
  'image/jpg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  -- Videos
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/webm',
  -- Audio
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  -- Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  -- Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  -- AutoCAD files
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
  -- Generic binary for unknown file types
  'application/octet-stream'
],
file_size_limit = 52428800 -- 50MB limit
WHERE id = 'project-media';

-- ==============================================
-- 2. UPDATE DISCUSSIONS BUCKET (if it exists)
-- ==============================================
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Images
  'image/jpeg',
  'image/jpg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  -- Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  -- AutoCAD files
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
  -- Generic binary for unknown file types
  'application/octet-stream'
],
file_size_limit = 52428800 -- 50MB limit
WHERE id = 'discussions';

-- ==============================================
-- 3. UPDATE DOCUMENTS BUCKET (if it exists)
-- ==============================================
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  -- Images (for document previews)
  'image/jpeg',
  'image/jpg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  -- AutoCAD files
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
  -- Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  -- Generic binary for unknown file types
  'application/octet-stream'
],
file_size_limit = 52428800 -- 50MB limit
WHERE id = 'documents';

-- ==============================================
-- 4. UPDATE PROJECT-DOCUMENTS BUCKET (if it exists)
-- ==============================================
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  -- Images
  'image/jpeg',
  'image/jpg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  -- Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/rtf',
  -- Videos
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/webm',
  -- Audio
  'audio/mp3',
  'audio/wav',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  -- AutoCAD files
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
  -- Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  -- Generic binary for unknown file types
  'application/octet-stream'
],
file_size_limit = 52428800 -- 50MB limit
WHERE id = 'project-documents';

-- ==============================================
-- 5. VERIFY ALL UPDATES
-- ==============================================
SELECT 
  id, 
  name, 
  file_size_limit,
  array_length(allowed_mime_types, 1) as mime_type_count,
  allowed_mime_types
FROM storage.buckets 
WHERE id IN ('project-media', 'discussions', 'documents', 'project-documents')
ORDER BY id;

-- ==============================================
-- 6. CHECK FOR ANY RLS POLICIES THAT MIGHT BLOCK UPLOADS
-- ==============================================
-- You can uncomment this to see current storage policies:
-- SELECT * FROM storage.objects WHERE bucket_id IN ('project-media', 'discussions', 'documents', 'project-documents') LIMIT 10;
