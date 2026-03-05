-- Update Rothco contact page to show ContactForm component
-- Run in Supabase SQL Editor for Rothco's database
-- clientId should match RAILWAY_PROJECT_NAME (e.g. rothco-firstbranch)

UPDATE "cmsPages"
SET
  content = '<ContactForm />',
  template = 'fullform',
  title = COALESCE(title, 'Contact us'),
  description = COALESCE(description, 'Get in touch with Rothco Built')
WHERE slug = 'contact'
  AND ("clientId" IS NULL OR "clientId" = 'rothco-firstbranch' OR "clientId" = 'rothco-built');
