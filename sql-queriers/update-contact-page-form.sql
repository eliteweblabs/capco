-- Update contact page to show ContactForm component
-- Run in Supabase SQL Editor
-- For capco-firstbranch: use clientId = 'capco-firstbranch' or omit for global page

UPDATE "cmsPages"
SET
  content = '<ContactForm />',
  template = 'fullform'
WHERE slug = 'contact'
  AND ("clientId" IS NULL OR "clientId" = 'capco-firstbranch');
