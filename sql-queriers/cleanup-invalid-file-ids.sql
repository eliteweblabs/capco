-- Cleanup Invalid File Records
-- This script identifies and removes files with invalid or null IDs
-- Run this to clean up any corrupted file records that shouldn't appear in the media manager

-- First, let's see what we have
SELECT 
  id,
  "fileName",
  "filePath",
  "projectId",
  "targetLocation",
  "uploadedAt"
FROM files
WHERE id IS NULL 
   OR id <= 0;

-- If any records are found above, uncomment and run this to delete them:
-- DELETE FROM files
-- WHERE id IS NULL 
--    OR id <= 0;

-- Also check for files with missing critical fields
SELECT 
  id,
  "fileName",
  "filePath",
  "bucketName",
  "projectId",
  "targetLocation"
FROM files
WHERE "fileName" IS NULL 
   OR "filePath" IS NULL
   OR "bucketName" IS NULL;

-- If you want to delete files with missing critical fields, uncomment:
-- DELETE FROM files
-- WHERE "fileName" IS NULL 
--    OR "filePath" IS NULL
--    OR "bucketName" IS NULL;
