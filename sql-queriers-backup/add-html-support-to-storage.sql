-- Add HTML MIME type support to project-media bucket
-- This allows generated PDF documents to be saved as HTML files

UPDATE storage.buckets 
SET allowed_mime_types = array_append(
  COALESCE(allowed_mime_types, ARRAY[]::text[]), 
  'text/html'
)
WHERE id = 'project-media';

-- Also add other common document MIME types that might be useful
UPDATE storage.buckets 
SET allowed_mime_types = array_cat(
  COALESCE(allowed_mime_types, ARRAY[]::text[]), 
  ARRAY[
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
