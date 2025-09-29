-- Generate status slugs from status names and save to new columns
-- This will populate client_status_slug and admin_status_slug columns

-- First, add the new columns if they don't exist
ALTER TABLE project_statuses 
ADD COLUMN IF NOT EXISTS client_status_slug TEXT,
ADD COLUMN IF NOT EXISTS admin_status_slug TEXT;

-- Function to generate slug from status name
CREATE OR REPLACE FUNCTION generate_status_slug(status_name TEXT)
RETURNS TEXT AS $$
BEGIN
  IF status_name IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convert to lowercase, remove special characters, replace spaces with hyphens
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(status_name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update all rows with generated slugs
UPDATE project_statuses 
SET 
  client_status_slug = generate_status_slug(client_status_name),
  admin_status_slug = generate_status_slug(admin_status_name)
WHERE 
  client_status_name IS NOT NULL 
  OR admin_status_name IS NOT NULL;

-- Verify the results
SELECT 
  status_code,
  client_status_name,
  client_status_slug,
  admin_status_name,
  admin_status_slug
FROM project_statuses 
ORDER BY status_code;

-- Clean up the function (optional - you can keep it for future use)
-- DROP FUNCTION IF EXISTS generate_status_slug(TEXT);
