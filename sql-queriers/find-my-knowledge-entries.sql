-- Find knowledge entries created by the current user
-- Run this in Supabase SQL Editor while authenticated

-- 1. Check your current user ID
SELECT 
    'Current User ID' as info,
    auth.uid() as user_id;

-- 2. Find all knowledge entries (including yours)
SELECT 
    id,
    title,
    category,
    priority,
    "isActive",
    "authorId",
    "createdAt",
    CASE 
        WHEN "authorId" IS NULL THEN 'System/Sample Entry'
        WHEN "authorId" = auth.uid() THEN 'Your Entry'
        ELSE 'Other User Entry'
    END as entry_type
FROM ai_agent_knowledge
ORDER BY "createdAt" DESC;

-- 3. Find only YOUR entries
SELECT 
    id,
    title,
    category,
    priority,
    "isActive",
    "authorId",
    "createdAt"
FROM ai_agent_knowledge
WHERE "authorId" = auth.uid()
ORDER BY "createdAt" DESC;

-- 4. Count entries by author
SELECT 
    CASE 
        WHEN "authorId" IS NULL THEN 'System/Sample'
        WHEN "authorId" = auth.uid() THEN 'You'
        ELSE 'Other Users'
    END as author_type,
    COUNT(*) as count
FROM ai_agent_knowledge
GROUP BY 
    CASE 
        WHEN "authorId" IS NULL THEN 'System/Sample'
        WHEN "authorId" = auth.uid() THEN 'You'
        ELSE 'Other Users'
    END;

-- 5. Check RLS policies for your user
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'ai_agent_knowledge';

