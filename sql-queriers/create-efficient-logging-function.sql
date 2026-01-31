-- Create PostgreSQL function to append log entries efficiently
-- This avoids the read-modify-write pattern that caused the runaway logging

CREATE OR REPLACE FUNCTION append_project_log(
  project_id INTEGER,
  log_entry JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use jsonb_insert to append without reading entire array
  -- This is MUCH more efficient for large log arrays
  UPDATE projects 
  SET log = jsonb_insert(
    COALESCE(log, '[]'::jsonb),
    '{-1}',  -- Append at end (-1 means last position)
    log_entry
  )
  WHERE id = project_id;
END;
$$;

-- Optional: Add a function to limit log size (prevent future runaways)
CREATE OR REPLACE FUNCTION append_project_log_with_limit(
  project_id INTEGER,
  log_entry JSONB,
  max_entries INTEGER DEFAULT 1000
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get current log size
  SELECT jsonb_array_length(COALESCE(log, '[]'::jsonb))
  INTO current_count
  FROM projects
  WHERE id = project_id;

  -- If we're at the limit, remove oldest entries before adding new one
  IF current_count >= max_entries THEN
    UPDATE projects
    SET log = jsonb_insert(
      -- Keep only the last (max_entries - 1) entries
      (SELECT jsonb_agg(elem)
       FROM (
         SELECT elem
         FROM jsonb_array_elements(log) elem
         ORDER BY (elem->>'timestamp') DESC
         LIMIT max_entries - 1
       ) subq),
      '{-1}',
      log_entry
    )
    WHERE id = project_id;
  ELSE
    -- Normal append
    UPDATE projects
    SET log = jsonb_insert(
      COALESCE(log, '[]'::jsonb),
      '{-1}',
      log_entry
    )
    WHERE id = project_id;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION append_project_log(INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION append_project_log(INTEGER, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION append_project_log_with_limit(INTEGER, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION append_project_log_with_limit(INTEGER, JSONB, INTEGER) TO anon;
