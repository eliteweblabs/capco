-- Check what logo SVG is currently stored in the database
SELECT 
    key,
    LEFT(value, 100) as value_preview,
    LENGTH(value) as value_length,
    CASE 
        WHEN value LIKE '<svg%' THEN 'Valid SVG'
        WHEN value = '' THEN 'Empty'
        ELSE 'Invalid'
    END as status
FROM "globalSettings"
WHERE key = 'logo';

-- Also check logoClasses
SELECT key, value
FROM "globalSettings"
WHERE key = 'logoClasses';
