-- EMERGENCY: Disable the updatedAt trigger temporarily
-- This reduces write operations by 50%

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

-- You can re-enable later with:
-- CREATE TRIGGER update_projects_updated_at
--     BEFORE UPDATE ON projects
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_on_status_change();
