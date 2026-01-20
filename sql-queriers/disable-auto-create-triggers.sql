-- ================================================
-- DISABLE AUTO-CREATE TRIGGERS FOR PUNCHLIST AND DISCUSSIONS
-- ================================================
-- This script removes the automatic creation of punchlist
-- and discussion items when new projects are created.
-- Templates will now be managed through the CMS instead.

-- Drop the punchlist trigger
DROP TRIGGER IF EXISTS trigger_auto_create_punchlist ON projects;

-- Drop the discussion trigger
DROP TRIGGER IF EXISTS trigger_assign_default_discussion ON projects;

-- Optional: Keep the functions for manual use but document they're deprecated
COMMENT ON FUNCTION auto_create_punchlist_items() IS 
'DEPRECATED: Auto-creation disabled. Use project_item_templates table instead.';

COMMENT ON FUNCTION assign_default_discussion_to_project() IS 
'DEPRECATED: Auto-creation disabled. Use project_item_templates table instead.';

-- Verify triggers are dropped
SELECT 
  schemaname,
  tablename, 
  tgname as trigger_name,
  tgtype,
  tgenabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'projects'
  AND t.tgname IN ('trigger_auto_create_punchlist', 'trigger_assign_default_discussion');

-- If the query above returns no rows, triggers are successfully removed
