-- Sync assignedToData when profile avatar changes
-- Use this ONLY if you add a denormalized assignedToData (jsonb) column to projects.
-- If you keep fetching assignedToProfile from profiles (current approach), you DON'T need this.

-- 1. Add the column (run once)
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS "assignedToData" jsonb;

-- 2. When profiles.avatarUrl changes, update all projects where assignedToId = that profile
CREATE OR REPLACE FUNCTION sync_assigned_to_avatar_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."avatarUrl" IS DISTINCT FROM NEW."avatarUrl" THEN
    UPDATE projects
    SET "assignedToData" = jsonb_build_object(
      'id', NEW.id,
      'avatarUrl', NEW."avatarUrl"
    )
    WHERE "assignedToId" = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_assigned_to_avatar
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_assigned_to_avatar_on_profile_update();

-- 3a. When project.assignedToId changes (UPDATE), populate assignedToData from profiles
CREATE OR REPLACE FUNCTION set_assigned_to_data_on_project_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."assignedToId" IS DISTINCT FROM OLD."assignedToId" THEN
    IF NEW."assignedToId" IS NOT NULL THEN
      SELECT jsonb_build_object('id', p.id, 'avatarUrl', p."avatarUrl")
      INTO NEW."assignedToData"
      FROM profiles p
      WHERE p.id = NEW."assignedToId";
    ELSE
      NEW."assignedToData" = NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_assigned_to_data_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_assigned_to_data_on_project_update();

-- 3b. On INSERT, populate assignedToData when assignedToId is set
CREATE OR REPLACE FUNCTION set_assigned_to_data_on_project_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."assignedToId" IS NOT NULL THEN
    SELECT jsonb_build_object('id', p.id, 'avatarUrl', p."avatarUrl")
    INTO NEW."assignedToData"
    FROM profiles p
    WHERE p.id = NEW."assignedToId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_assigned_to_data_on_insert
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_assigned_to_data_on_project_insert();
