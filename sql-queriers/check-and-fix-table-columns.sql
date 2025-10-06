-- =====================================================
-- CHECK AND FIX TABLE COLUMNS
-- =====================================================
-- This script checks what columns actually exist in your tables
-- and renames any remaining snake_case columns to camelCase
-- =====================================================

-- 1. Check what columns exist in the discussion table
SELECT 
    'DISCUSSION TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'discussion' 
AND table_schema = 'public'
ORDER BY column_name;

-- 2. Check what columns exist in the projects table
SELECT 
    'PROJECTS TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
ORDER BY column_name;

-- 3. Check what columns exist in the files table
SELECT 
    'FILES TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'files' 
AND table_schema = 'public'
ORDER BY column_name;

-- 4. Check what columns exist in the profiles table
SELECT 
    'PROFILES TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY column_name;

-- 5. Check what columns exist in the punchlist table
SELECT 
    'PUNCHLIST TABLE COLUMNS:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'punchlist' 
AND table_schema = 'public'
ORDER BY column_name;

-- 6. Find all snake_case columns that need to be renamed
SELECT 
    'SNAKE_CASE COLUMNS TO RENAME:' as info,
    table_name,
    column_name,
    'Rename to: ' || 
    CASE 
        WHEN column_name = 'project_id' THEN 'projectId'
        WHEN column_name = 'author_id' THEN 'authorId'
        WHEN column_name = 'created_at' THEN 'createdAt'
        WHEN column_name = 'updated_at' THEN 'updatedAt'
        WHEN column_name = 'mark_completed' THEN 'markCompleted'
        WHEN column_name = 'due_date' THEN 'dueDate'
        WHEN column_name = 'elapsed_time' THEN 'elapsedTime'
        WHEN column_name = 'incomplete_discussions' THEN 'incompleteDiscussions'
        WHEN column_name = 'punchlist_count' THEN 'punchlistCount'
        WHEN column_name = 'featured_image_data' THEN 'featuredImageData'
        WHEN column_name = 'featured_image_id' THEN 'featuredImageId'
        WHEN column_name = 'file_name' THEN 'fileName'
        WHEN column_name = 'file_path' THEN 'filePath'
        WHEN column_name = 'file_type' THEN 'fileType'
        WHEN column_name = 'file_size' THEN 'fileSize'
        WHEN column_name = 'uploaded_at' THEN 'uploadedAt'
        WHEN column_name = 'first_name' THEN 'firstName'
        WHEN column_name = 'last_name' THEN 'lastName'
        WHEN column_name = 'company_name' THEN 'companyName'
        WHEN column_name = 'mobile_carrier' THEN 'mobileCarrier'
        WHEN column_name = 'sms_alerts' THEN 'smsAlerts'
        ELSE 'Check manually'
    END as suggested_rename
FROM information_schema.columns 
WHERE table_schema = 'public'
AND column_name LIKE '%_%'
AND column_name NOT LIKE '%_id'  -- Exclude foreign key columns that might legitimately be snake_case
AND column_name NOT LIKE '%_at'  -- Exclude timestamp columns that might legitimately be snake_case
ORDER BY table_name, column_name;
