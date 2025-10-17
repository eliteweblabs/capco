-- Script to identify and fix file data inconsistencies
BEGIN;

-- First, let's see what files have invalid project references
WITH invalid_files AS (
  SELECT 
    f.id,
    f."fileName",
    f."projectId",
    f."authorId",
    f."uploadedAt",
    f."bucketName",
    f."fileSize",
    prof.companyName as author_name,
    EXISTS(
      SELECT 1 FROM storage.objects o 
      WHERE o.name = f."filePath"
    ) as file_exists_in_storage
  FROM files f
  LEFT JOIN projects p ON f."projectId"::integer = p.id
  LEFT JOIN profiles prof ON f."authorId" = prof.id
  WHERE p.id IS NULL AND f."projectId" IS NOT NULL
)
SELECT 
  id,
  "fileName",
  "projectId",
  author_name,
  to_char("uploadedAt", 'YYYY-MM-DD HH24:MI:SS') as uploaded_at,
  CASE 
    WHEN file_exists_in_storage THEN 'Yes'
    ELSE 'No'
  END as exists_in_storage,
  ROUND(CAST("fileSize" as numeric) / 1024 / 1024, 2) || ' MB' as file_size,
  "bucketName"
FROM invalid_files
ORDER BY "uploadedAt" DESC;

-- Create a backup of problematic files
CREATE TABLE IF NOT EXISTS files_backup_invalid_refs AS
SELECT * FROM files
WHERE "projectId" IN (
  SELECT "projectId" FROM files f
  LEFT JOIN projects p ON f."projectId"::integer = p.id
  WHERE p.id IS NULL AND f."projectId" IS NOT NULL
);

-- Option 1: Set invalid projectId references to NULL
/*
UPDATE files
SET "projectId" = NULL
WHERE "projectId" IN (
  SELECT f."projectId" FROM files f
  LEFT JOIN projects p ON f."projectId"::integer = p.id
  WHERE p.id IS NULL AND f."projectId" IS NOT NULL
);
*/

-- Option 2: Delete files with invalid project references
/*
DELETE FROM files
WHERE "projectId" IN (
  SELECT f."projectId" FROM files f
  LEFT JOIN projects p ON f."projectId"::integer = p.id
  WHERE p.id IS NULL AND f."projectId" IS NOT NULL
);
*/

-- Option 3: Move files to a default project (create if doesn't exist)
/*
WITH default_project AS (
  INSERT INTO projects (title, status, "authorId")
  VALUES ('Data Recovery Project', 0, (SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1))
  ON CONFLICT (title) DO UPDATE SET title = projects.title
  RETURNING id
)
UPDATE files
SET "projectId" = (SELECT id FROM default_project)
WHERE "projectId" IN (
  SELECT f."projectId" FROM files f
  LEFT JOIN projects p ON f."projectId"::integer = p.id
  WHERE p.id IS NULL AND f."projectId" IS NOT NULL
);
*/

-- Verify the changes
SELECT 
  COUNT(*) as invalid_refs_count
FROM files f
LEFT JOIN projects p ON f."projectId"::integer = p.id
WHERE p.id IS NULL AND f."projectId" IS NOT NULL;

ROLLBACK; -- Change to COMMIT once you've chosen a fix strategy
