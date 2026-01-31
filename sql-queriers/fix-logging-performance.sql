-- Fix the logging performance issue
-- Use jsonb_insert to append without reading entire array

-- This is what's currently happening (BAD):
-- 1. SELECT log FROM projects WHERE id = 23
-- 2. Parse 23MB of JSON in application
-- 3. Add one entry
-- 4. Write 23MB back

-- This is what we should do (GOOD):
-- UPDATE projects 
-- SET log = jsonb_insert(COALESCE(log, '[]'::jsonb), '{-1}', new_entry::jsonb)
-- WHERE id = 23;

-- Example of proper append:
UPDATE projects 
SET log = jsonb_insert(
  COALESCE(log, '[]'::jsonb), 
  '{-1}',  -- Append at end
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'projectUpdated',
    'user', 'System',
    'message', 'Example log entry',
    'metadata', '{}'::jsonb
  )
)
WHERE id = 23;
