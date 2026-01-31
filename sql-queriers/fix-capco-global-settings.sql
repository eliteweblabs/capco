-- Fix CAPCO Design Group global settings
-- This script updates the globalSettings table to have the correct CAPCO data
-- Run this on the CAPCO production database (capcofire.com)

-- Update company name (currently shows "Rothco Built" which is wrong)
UPDATE "globalSettings"
SET value = 'CAPCO Design Group', "updatedAt" = NOW()
WHERE key = 'companyName';

-- Also update legacy company_name key if it exists
UPDATE "globalSettings"
SET value = 'CAPCO Design Group', "updatedAt" = NOW()
WHERE key = 'company_name';

-- Update website URL
UPDATE "globalSettings"
SET value = 'https://capcofire.com', "updatedAt" = NOW()
WHERE key = 'website';

-- Update email
UPDATE "globalSettings"
SET value = 'contact@capcofire.com', "updatedAt" = NOW()
WHERE key = 'email';

-- Update phone (CAPCO phone from VAPI)
UPDATE "globalSettings"
SET value = '+16175810583', "updatedAt" = NOW()
WHERE key = 'phone';

-- Update slogan
UPDATE "globalSettings"
SET value = 'Professional Fire Protection Plan Review & Approval', "updatedAt" = NOW()
WHERE key = 'slogan';

-- Update primary color (CAPCO purple)
UPDATE "globalSettings"
SET value = '#825BDD', "updatedAt" = NOW()
WHERE key = 'primary_color';

-- Update secondary color
UPDATE "globalSettings"
SET value = '#0ea5e9', "updatedAt" = NOW()
WHERE key = 'secondary_color';

-- Update Plausible domain
UPDATE "globalSettings"
SET value = 'capcofire.com', "updatedAt" = NOW()
WHERE key = 'plausible_site_id';

-- Update social networks (CAPCO doesn't have Facebook like Rothco)
UPDATE "globalSettings"
SET value = '[]', "updatedAt" = NOW()
WHERE key = 'social_networks';

-- If any keys don't exist, insert them
INSERT INTO "globalSettings" (key, value, "valueType", category, description, "updatedAt")
VALUES 
  ('companyName', 'CAPCO Design Group', 'text', 'company', 'Company name', NOW()),
  ('website', 'https://capcofire.com', 'text', 'company', 'Company website URL', NOW()),
  ('email', 'contact@capcofire.com', 'text', 'company', 'Company email', NOW()),
  ('phone', '+16175810583', 'text', 'company', 'Company phone', NOW()),
  ('slogan', 'Professional Fire Protection Plan Review & Approval', 'text', 'company', 'Company slogan', NOW()),
  ('primary_color', '#825BDD', 'text', 'branding', 'Primary brand color', NOW()),
  ('secondary_color', '#0ea5e9', 'text', 'branding', 'Secondary brand color', NOW()),
  ('plausible_site_id', 'capcofire.com', 'text', 'analytics', 'Plausible analytics site ID', NOW()),
  ('social_networks', '[]', 'json', 'company', 'Social media links', NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, "updatedAt" = NOW();

-- Verify the changes
SELECT key, value 
FROM "globalSettings" 
WHERE key IN ('companyName', 'company_name', 'website', 'email', 'phone', 'slogan', 'primary_color', 'secondary_color')
ORDER BY key;
