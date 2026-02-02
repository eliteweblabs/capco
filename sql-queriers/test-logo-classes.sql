-- Test logoClasses functionality
-- Run this to verify logoClasses is properly saved and retrieved

-- Check if logoClasses exists in globalSettings
SELECT 
  id,
  key,
  value,
  category,
  "valueType",
  "updatedAt"
FROM "globalSettings"
WHERE key = 'logoClasses';

-- If it doesn't exist, insert a test value
-- INSERT INTO "globalSettings" (key, value, category, "valueType")
-- VALUES ('logoClasses', 'h-12 w-auto text-primary-600', 'logos', 'text')
-- ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- View all logo-related settings
SELECT 
  key,
  LEFT(value, 50) as value_preview,
  category,
  "valueType"
FROM "globalSettings"
WHERE category = 'logos'
ORDER BY key;
