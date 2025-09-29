-- Fix documents bucket to ensure PDF support
-- This script ensures PDFs are properly allowed in the documents bucket

-- First, check if the bucket exists and what its current MIME types are
-- (You can run this as a SELECT to see current state)
-- SELECT id, name, allowed_mime_types FROM storage.buckets WHERE id = 'documents';

-- Update the documents bucket to ensure PDF support
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'application/msword',
  'text/plain',
  'text/csv',
  'application/rtf',
  'application/zip',
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
]
WHERE id = 'documents';

-- If the bucket doesn't exist, create it
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
    'application/rtf',
    'application/zip',
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
    -- Generic binary for unknown file types
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;

-- Verify the update
SELECT id, name, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'documents';

-- Also check if there are any RLS policies blocking the upload
-- You can uncomment this to see current policies:
-- SELECT * FROM storage.objects WHERE bucket_id = 'documents' LIMIT 5;
