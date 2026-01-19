-- Schema Comparison Query
-- Run this on BOTH Capco and Rothco projects to compare
-- Copy results and compare manually, or use a script to automate

-- =====================================================
-- 1. LIST ALL TABLES
-- =====================================================
SELECT 
  'TABLE' as object_type,
  table_name as object_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- 2. LIST ALL COLUMNS IN KEY TABLES (for navigation)
-- =====================================================
SELECT 
  'COLUMN' as object_type,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'global_settings',
    'cms_pages',
    'profiles',
    'projects',
    'files',
    'discussion',
    'invoices',
    'payments',
    'ai_agent_conversations',
    'ai_agent_knowledge',
    'chatMessages',
    'chat_messages',
    'notifications',
    'bannerAlerts'
  )
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 3. COUNT ROWS IN KEY TABLES
-- =====================================================
SELECT 
  'ROW_COUNT' as object_type,
  'global_settings' as table_name,
  COUNT(*) as count
FROM global_settings
UNION ALL
SELECT 'ROW_COUNT', 'cms_pages', COUNT(*) FROM cms_pages
UNION ALL
SELECT 'ROW_COUNT', 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'ROW_COUNT', 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'ROW_COUNT', 'files', COUNT(*) FROM files
UNION ALL
SELECT 'ROW_COUNT', 'discussion', COUNT(*) FROM discussion
UNION ALL
SELECT 'ROW_COUNT', 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'ROW_COUNT', 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'ROW_COUNT', 'ai_agent_conversations', COUNT(*) FROM ai_agent_conversations
UNION ALL
SELECT 'ROW_COUNT', 'ai_agent_knowledge', COUNT(*) FROM ai_agent_knowledge
UNION ALL
SELECT 'ROW_COUNT', 'chatMessages', COUNT(*) FROM chatMessages
UNION ALL
SELECT 'ROW_COUNT', 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL
SELECT 'ROW_COUNT', 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'ROW_COUNT', 'bannerAlerts', COUNT(*) FROM bannerAlerts;

-- =====================================================
-- 4. CHECK GLOBAL_SETTINGS KEYS (affects navigation)
-- =====================================================
SELECT 
  'SETTING' as object_type,
  key,
  category,
  value_type,
  CASE WHEN value IS NULL THEN 'NULL' ELSE 'HAS_VALUE' END as has_value
FROM global_settings
ORDER BY category, key;

-- =====================================================
-- 5. CHECK FOR RLS POLICIES (might affect data visibility)
-- =====================================================
SELECT 
  'RLS_POLICY' as object_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'global_settings',
    'cms_pages',
    'profiles',
    'projects',
    'files',
    'discussion'
  )
ORDER BY tablename, policyname;
