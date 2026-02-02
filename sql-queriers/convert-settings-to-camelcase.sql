-- Convert globalSettings keys from snake_case to camelCase
-- This migration updates the 'key' column values to use camelCase naming convention

-- Update snake_case keys to camelCase
UPDATE "globalSettings" SET key = 'plausibleTrackingScript' WHERE key = 'plausible_tracking_script';
UPDATE "globalSettings" SET key = 'secondaryColor' WHERE key = 'secondary_color';
UPDATE "globalSettings" SET key = 'fontFamily' WHERE key = 'font_family';
UPDATE "globalSettings" SET key = 'socialNetworks' WHERE key = 'social_networks';
UPDATE "globalSettings" SET key = 'secondaryFontFamily' WHERE key = 'secondary_font_family';
UPDATE "globalSettings" SET key = 'ogImage' WHERE key = 'og_image';
UPDATE "globalSettings" SET key = 'primaryColor' WHERE key = 'primary_color';
UPDATE "globalSettings" SET key = 'plausibleScriptUrl' WHERE key = 'plausible_script_url';
UPDATE "globalSettings" SET key = 'plausibleSiteId' WHERE key = 'plausible_site_id';
UPDATE "globalSettings" SET key = 'plausibleDomain' WHERE key = 'plausible_domain';
UPDATE "globalSettings" SET key = 'customCss' WHERE key = 'custom_css';

-- Verify the changes
SELECT key, category, "valueType" 
FROM "globalSettings" 
ORDER BY key;
