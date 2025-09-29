-- Add elapsed_time column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS elapsed_time INTERVAL;

-- Create function to update elapsed_time for all projects
CREATE OR REPLACE FUNCTION update_project_elapsed_time()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsed_time = NOW() - created_at
  WHERE created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update elapsed_time for a specific project
CREATE OR REPLACE FUNCTION update_single_project_elapsed_time(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET elapsed_time = NOW() - created_at
  WHERE id = project_id_param AND created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update elapsed_time when a project is created
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.elapsed_time = NOW() - NEW.created_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_elapsed_time_on_insert ON projects;

-- Create trigger for new projects
CREATE TRIGGER update_elapsed_time_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time();

-- Create trigger for updates (in case created_at changes)
CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if created_at changed
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    NEW.elapsed_time = NOW() - NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing update trigger if it exists
DROP TRIGGER IF EXISTS update_elapsed_time_on_update ON projects;

-- Create trigger for updates
CREATE TRIGGER update_elapsed_time_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time_on_update();

-- Initial update to populate existing projects
SELECT update_project_elapsed_time();

-- Create a scheduled job function (this will need to be set up with pg_cron or similar)
-- For now, we'll create a function that can be called manually or via API
CREATE OR REPLACE FUNCTION schedule_elapsed_time_updates()
RETURNS void AS $$
BEGIN
  -- This function can be called periodically to update all projects
  -- In production, you might want to use pg_cron extension:
  -- SELECT cron.schedule('update-elapsed-time', '* * * * *', 'SELECT update_project_elapsed_time();');
  
  -- For now, just update all projects
  PERFORM update_project_elapsed_time();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_project_elapsed_time() TO authenticated;
GRANT EXECUTE ON FUNCTION update_single_project_elapsed_time(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_elapsed_time_updates() TO authenticated;
