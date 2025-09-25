-- Add PDF MIME type support to project-media bucket
-- This allows generated PDF documents to be saved as PDF files

UPDATE storage.buckets 
SET allowed_mime_types = array_append(
  COALESCE(allowed_mime_types, ARRAY[]::text[]), 
  'application/pdf'
)
WHERE id = 'project-media';

-- Also ensure HTML is still supported for templates
UPDATE storage.buckets 
SET allowed_mime_types = array_cat(
  COALESCE(allowed_mime_types, ARRAY[]::text[]), 
  ARRAY[
    'application/pdf',
    'text/html',
    'text/plain',
    'application/xhtml+xml',
    'text/css',
    'application/javascript',
    'text/javascript'
  ]
)
WHERE id = 'project-media';

-- Verify the update
SELECT id, name, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'project-media';
