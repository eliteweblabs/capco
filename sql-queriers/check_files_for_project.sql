-- Check if there are any files for project 8
SELECT 
    id,
    "projectId",
    "fileName",
    "fileType",
    "targetLocation",
    "bucketName",
    "authorId",
    "uploadedAt",
    "isPrivate",
    "status"
FROM files 
WHERE "projectId" = 8
ORDER BY "uploadedAt" DESC;

-- Also check total count
SELECT COUNT(*) as total_files_for_project_8
FROM files 
WHERE "projectId" = 8;

-- Check all files to see what projects have files
SELECT 
    "projectId",
    COUNT(*) as file_count
FROM files 
GROUP BY "projectId"
ORDER BY file_count DESC;
