-- Quick test to verify the ai_agent_knowledge table exists and check its structure
-- Run this in Supabase SQL Editor to diagnose issues

-- 1. Check if table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'ai_agent_knowledge';

-- 2. Check column names and types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_agent_knowledge'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'ai_agent_knowledge';

-- 4. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as "RLS_Enabled"
FROM pg_tables 
WHERE tablename = 'ai_agent_knowledge' 
AND schemaname = 'public';

-- 5. Try a test insert (replace with your actual user ID)
-- SELECT auth.uid(); -- Run this first to get your user ID
-- Then uncomment and run:
/*
INSERT INTO ai_agent_knowledge (title, content, category, tags, priority, "authorId", "isActive")
VALUES (
    'Test Entry',
    'This is a test knowledge entry',
    'test',
    ARRAY['test'],
    5,
    'YOUR_USER_ID_HERE'::uuid,
    true
)
RETURNING *;
*/

-- 6. Check existing entries
SELECT 
    id,
    title,
    category,
    priority,
    "isActive",
    "authorId",
    "createdAt"
FROM ai_agent_knowledge
ORDER BY "createdAt" DESC
LIMIT 10;

