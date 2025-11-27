-- Check ALL knowledge entries (admin view - bypasses RLS)
-- Run this in Supabase SQL Editor with admin/service role

-- 1. Count all entries
SELECT 
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE "authorId" IS NULL) as system_entries,
    COUNT(*) FILTER (WHERE "authorId" IS NOT NULL) as user_entries
FROM ai_agent_knowledge;

-- 2. Show all entries with author info
SELECT 
    k.id,
    k.title,
    k.category,
    k.priority,
    k."isActive",
    k."authorId",
    k."createdAt",
    CASE 
        WHEN k."authorId" IS NULL THEN 'System/Sample'
        ELSE COALESCE(p.email, p."firstName" || ' ' || p."lastName", 'Unknown User')
    END as author_name
FROM ai_agent_knowledge k
LEFT JOIN auth.users u ON k."authorId" = u.id
LEFT JOIN profiles p ON k."authorId" = p.id
ORDER BY k."createdAt" DESC;

-- 3. Group by author
SELECT 
    CASE 
        WHEN k."authorId" IS NULL THEN 'System/Sample Entries'
        ELSE COALESCE(p.email, p."firstName" || ' ' || p."lastName", u.email, 'Unknown User')
    END as author,
    COUNT(*) as entry_count,
    STRING_AGG(k.title, ', ' ORDER BY k."createdAt" DESC) as titles
FROM ai_agent_knowledge k
LEFT JOIN auth.users u ON k."authorId" = u.id
LEFT JOIN profiles p ON k."authorId" = p.id
GROUP BY 
    CASE 
        WHEN k."authorId" IS NULL THEN 'System/Sample Entries'
        ELSE COALESCE(p.email, p."firstName" || ' ' || p."lastName", u.email, 'Unknown User')
    END
ORDER BY entry_count DESC;

-- 4. Check for entries with "Jay" in the title
SELECT 
    id,
    title,
    category,
    priority,
    "authorId",
    "createdAt"
FROM ai_agent_knowledge
WHERE title ILIKE '%jay%'
ORDER BY "createdAt" DESC;

-- 5. Check recent entries (last hour)
SELECT 
    id,
    title,
    category,
    "authorId",
    "createdAt"
FROM ai_agent_knowledge
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

