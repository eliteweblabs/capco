-- Check for files with spaces or special characters in their filePath
-- This helps identify files that were uploaded before the filename sanitization fix

SELECT 
    id,
    "fileName",
    "filePath",
    "bucketName",
    "projectId",
    CASE 
        WHEN "filePath" LIKE '% %' THEN 'Contains spaces'
        WHEN "filePath" ~ '[^a-zA-Z0-9/\-_.]' THEN 'Contains special characters'
        ELSE 'OK'
    END as issue
FROM files
WHERE 
    "filePath" LIKE '% %' 
    OR "filePath" ~ '[^a-zA-Z0-9/\-_.]'
ORDER BY "uploadedAt" DESC;

-- Check which projects have featured images with problematic URLs
SELECT 
    p.id as project_id,
    p.title as project_title,
    p."featuredImageId",
    p."featuredImageData"->>'fileName' as featured_file_name,
    p."featuredImageData"->>'filePath' as featured_file_path,
    p."featuredImageData"->>'publicUrl' as featured_public_url,
    CASE 
        WHEN p."featuredImageData"->>'filePath' LIKE '% %' THEN 'Contains spaces'
        WHEN p."featuredImageData"->>'filePath' ~ '[^a-zA-Z0-9/\-_.]' THEN 'Contains special characters'
        ELSE 'OK'
    END as issue
FROM projects p
WHERE 
    p."featuredImageId" IS NOT NULL
    AND (
        p."featuredImageData"->>'filePath' LIKE '% %' 
        OR p."featuredImageData"->>'filePath' ~ '[^a-zA-Z0-9/\-_.]'
    )
ORDER BY p."updatedAt" DESC;

-- Count of affected files
SELECT 
    COUNT(*) as total_files_with_issues,
    COUNT(CASE WHEN "filePath" LIKE '% %' THEN 1 END) as files_with_spaces,
    COUNT(CASE WHEN "filePath" ~ '[^a-zA-Z0-9/\-_.]' THEN 1 END) as files_with_special_chars
FROM files
WHERE 
    "filePath" LIKE '% %' 
    OR "filePath" ~ '[^a-zA-Z0-9/\-_.]';
