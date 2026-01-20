-- Run this on CAPCO Supabase SQL Editor
-- https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql

-- Check which key tables exist
SELECT 
  'globalSettings' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'globalSettings'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'cmsPages',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cmsPages'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ai_agent_conversations',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ai_agent_conversations'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ai_agent_knowledge',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ai_agent_knowledge'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'chatMessages',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'chatMessages'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'chatMessages',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'chatMessages'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
ORDER BY table_name;

-- Also check which settings are missing
SELECT 
  category,
  COUNT(*) as count,
  string_agg(key, ', ' ORDER BY key) as keys
FROM globalSettings
GROUP BY category
ORDER BY category;
