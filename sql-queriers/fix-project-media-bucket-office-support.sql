-- Fix project-media bucket to support Office documents and other file types
-- This script updates the project-media bucket to include Office document MIME types

-- Update the project-media bucket to include Office documents and other file types
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

-- Verify the update
SELECT id, name, allowed_mime_types, file_size_limit
FROM storage.buckets 
WHERE id = 'project-media';

-- Also check if there are any RLS policies that might be blocking uploads
-- You can uncomment this to see current policies:
-- SELECT * FROM storage.objects WHERE bucket_id = 'project-media' LIMIT 5;
