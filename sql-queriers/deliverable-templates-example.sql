-- Example: register one deliverable PDF template after uploading to Storage bucket "deliverable-templates".
--
-- Steps:
-- 1. Deploy migration 20260508143000_deliverable_templates.sql (creates table + bucket + policies).
-- 2. In Supabase Storage, upload template.pdf under e.g. public/site-templates/as-built.pdf
--    (adjust path; must match storagePath exactly).
-- 3. Replace the INSERT values and run:

INSERT INTO "public"."deliverableTemplates" (
  "title",
  "description",
  "storageBucket",
  "storagePath",
  "isActive",
  "sortOrder"
) VALUES (
  'As-built cover sheet',
  'AcroForm field names must match shortcode hints (e.g. project_address, client_name).',
  'deliverable-templates',
  'site-templates/as-built.pdf',
  true,
  0
)
ON CONFLICT ("storageBucket", "storagePath") DO NOTHING;
