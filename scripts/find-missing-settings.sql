-- Run this on CAPCO to find which settings are missing
-- Compare the results with Rothco's 18 settings

-- Get all settings from Capco
SELECT 
  key, 
  category, 
  value_type,
  CASE WHEN value IS NULL THEN 'NULL' ELSE 'HAS_VALUE' END as has_value
FROM global_settings
ORDER BY category, key;

-- Expected settings from Rothco (18 total):
-- colors: primary_color, secondary_color (2)
-- company: address, company_name, email, phone, slogan, website (6)
-- general: font_family, og_image, plausible_domain, plausible_script_url, plausible_site_id, plausible_tracking_script, secondary_font_family, social_networks (8)
-- icons: icon (1)
-- logos: logo (1)

-- If Capco has 16, it's missing 2. Check which categories have fewer entries:
SELECT 
  category,
  COUNT(*) as count,
  string_agg(key, ', ' ORDER BY key) as keys
FROM global_settings
GROUP BY category
ORDER BY category;
