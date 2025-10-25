-- Test 3: Check what files exist in avatars folder
SELECT * FROM storage.objects WHERE name LIKE 'avatars/%' LIMIT 5;

