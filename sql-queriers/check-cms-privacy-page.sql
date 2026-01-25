-- Check the privacy page in the CMS
SELECT 
  slug,
  title,
  description,
  LEFT(content, 200) as content_preview,
  template,
  client_id,
  is_active,
  LENGTH(content) as content_length
FROM "cmsPages"
WHERE slug = 'privacy'
ORDER BY client_id NULLS LAST;
