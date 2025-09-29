-- Add due_date column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Create function to set due_date to current time + 48 hours for new projects
CREATE OR REPLACE FUNCTION set_project_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Set due_date to current time + 48 hours for new projects
  NEW.due_date = NOW() + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_due_date_on_insert ON projects;

-- Create trigger for new projects
CREATE TRIGGER set_due_date_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_due_date();

-- Create function to update due_date for existing projects that don't have one
CREATE OR REPLACE FUNCTION update_missing_due_dates()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET due_date = created_at + INTERVAL '48 hours'
  WHERE due_date IS NULL AND created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update due_date for a specific project
CREATE OR REPLACE FUNCTION update_single_project_due_date(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET due_date = created_at + INTERVAL '48 hours'
  WHERE id = project_id_param AND created_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset due_date to current time + 48 hours
CREATE OR REPLACE FUNCTION reset_project_due_date(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET due_date = NOW() + INTERVAL '48 hours'
  WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to extend due_date by a specific number of hours
CREATE OR REPLACE FUNCTION extend_project_due_date(project_id_param INTEGER, hours_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET due_date = COALESCE(due_date, NOW()) + (hours_to_add || ' hours')::INTERVAL
  WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_project_due_date() TO authenticated;
GRANT EXECUTE ON FUNCTION update_missing_due_dates() TO authenticated;
GRANT EXECUTE ON FUNCTION update_single_project_due_date(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_project_due_date(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_project_due_date(INTEGER, INTEGER) TO authenticated;

-- Initial update to populate existing projects that don't have due_date
SELECT update_missing_due_dates();

-- Add comment to the column for documentation
COMMENT ON COLUMN projects.due_date IS 'Automatically set to created_at + 48 hours for new projects. Can be manually updated if needed.';
