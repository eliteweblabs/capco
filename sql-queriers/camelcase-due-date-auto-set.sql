-- Add dueDate column to projects table (camelCase)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP WITH TIME ZONE;

-- Create function to set dueDate to current time + 48 hours for new projects
CREATE OR REPLACE FUNCTION set_project_due_date_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Set dueDate to current time + 48 hours for new projects
  NEW."dueDate" = NOW() + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to set dueDate based on status changes
CREATE OR REPLACE FUNCTION set_project_due_date_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Set due date when project status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Set due date to 30 days from now for new projects
    IF NEW.status = 0 THEN
      NEW."dueDate" := NOW() + INTERVAL '30 days';
    -- Set to 14 days for projects under review
    ELSIF NEW.status = 1 THEN
      NEW."dueDate" := NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_due_date_on_insert ON projects;
DROP TRIGGER IF EXISTS set_due_date_on_status_change ON projects;

-- Create trigger for new projects (INSERT)
CREATE TRIGGER set_due_date_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_due_date_on_insert();

-- Create trigger for status changes (UPDATE)
CREATE TRIGGER set_due_date_on_status_change
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_due_date_on_status_change();

-- Create function to update dueDate for existing projects that don't have one
CREATE OR REPLACE FUNCTION update_missing_due_dates()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = "createdAt" + INTERVAL '48 hours'
  WHERE "dueDate" IS NULL AND "createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update dueDate for a specific project
CREATE OR REPLACE FUNCTION update_single_project_due_date(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = "createdAt" + INTERVAL '48 hours'
  WHERE id = project_id_param AND "createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to reset dueDate to current time + 48 hours
CREATE OR REPLACE FUNCTION reset_project_due_date(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = NOW() + INTERVAL '48 hours'
  WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to extend dueDate by a specific number of hours
CREATE OR REPLACE FUNCTION extend_project_due_date(project_id_param INTEGER, hours_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = COALESCE("dueDate", NOW()) + (hours_to_add || ' hours')::INTERVAL
  WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_project_due_date_on_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION set_project_due_date_on_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION update_missing_due_dates() TO authenticated;
GRANT EXECUTE ON FUNCTION update_single_project_due_date(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_project_due_date(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_project_due_date(INTEGER, INTEGER) TO authenticated;

