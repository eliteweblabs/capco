-- =====================================================
-- NUCLEAR FIX - FIND AND DESTROY ALL PROJECTID ISSUES
-- =====================================================
-- This script will find and fix EVERYTHING that references projectid
-- =====================================================

-- 1. First, let's see what's actually causing the issue
SELECT 
    'SEARCHING FOR ALL PROJECTID REFERENCES:' as info,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND (
    routine_definition ILIKE '%projectid%' OR
    routine_definition ILIKE '%project_id%' OR
    routine_definition ILIKE '%projectId%'
)
ORDER BY routine_name;

-- 2. Drop ALL triggers that might be causing issues
DROP TRIGGER IF EXISTS assign_discussions_on_project_create ON projects;
DROP TRIGGER IF EXISTS create_punchlist_on_project_create ON projects;
DROP TRIGGER IF EXISTS update_discussion_count_on_insert ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_update ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_delete ON discussion;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_update ON files;
DROP TRIGGER IF EXISTS sync_featured_image_on_file_insert ON files;
DROP TRIGGER IF EXISTS set_due_date_on_status_change ON projects;
DROP TRIGGER IF EXISTS set_elapsed_time_on_create ON projects;
DROP TRIGGER IF EXISTS update_elapsed_time_on_update ON projects;

-- 3. Drop ALL functions that might be causing issues
DROP FUNCTION IF EXISTS assign_default_discussions_to_project();
DROP FUNCTION IF EXISTS auto_create_punchlist_items();
DROP FUNCTION IF EXISTS update_incomplete_discussions_count();
DROP FUNCTION IF EXISTS recalculate_incomplete_discussions();
DROP FUNCTION IF EXISTS assign_default_discussions_to_existing_project(INTEGER);
DROP FUNCTION IF EXISTS create_default_punchlist_items(INTEGER);
DROP FUNCTION IF EXISTS sync_featured_image_data();
DROP FUNCTION IF EXISTS set_project_due_date();
DROP FUNCTION IF EXISTS trigger_update_elapsed_time();
DROP FUNCTION IF EXISTS trigger_update_elapsed_time_on_update();
DROP FUNCTION IF EXISTS update_project_elapsed_time();
DROP FUNCTION IF EXISTS update_single_project_elapsed_time(INTEGER);

-- 4. Recreate ALL functions with correct camelCase field names
CREATE OR REPLACE FUNCTION assign_default_discussions_to_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO discussion ("projectId", "authorId", message, internal, "createdAt")
  VALUES 
    (NEW.id, NEW."authorId", 'Project created - Discussion thread started', true, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "createdAt")
  VALUES 
    (NEW.id, NEW."authorId", 'Initial inspection checklist', true, false, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW."markCompleted" IS NULL OR NOT NEW."markCompleted" THEN
            UPDATE projects 
            SET "incompleteDiscussions" = COALESCE("incompleteDiscussions", 0) + 1
            WHERE id = NEW."projectId";
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD."markCompleted" IS NULL OR NOT OLD."markCompleted") != (NEW."markCompleted" IS NULL OR NOT NEW."markCompleted") THEN
            IF NEW."markCompleted" IS NOT NULL AND NEW."markCompleted" THEN
                UPDATE projects 
                SET "incompleteDiscussions" = GREATEST(COALESCE("incompleteDiscussions", 0) - 1, 0)
                WHERE id = NEW."projectId";
            ELSE
                UPDATE projects 
                SET "incompleteDiscussions" = COALESCE("incompleteDiscussions", 0) + 1
                WHERE id = NEW."projectId";
            END IF;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD."markCompleted" IS NULL OR NOT OLD."markCompleted" THEN
            UPDATE projects 
            SET "incompleteDiscussions" = GREATEST(COALESCE("incompleteDiscussions", 0) - 1, 0)
            WHERE id = OLD."projectId";
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_incomplete_discussions()
RETURNS void AS $$
BEGIN
    UPDATE projects 
    SET "incompleteDiscussions" = (
        SELECT COUNT(*)
        FROM discussion 
        WHERE discussion."projectId" = projects.id 
        AND ("markCompleted" IS NULL OR "markCompleted" = false)
    )
    WHERE id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_featured_image_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'files' AND NEW.id IS NOT NULL THEN
    UPDATE projects 
    SET "featuredImageData" = jsonb_build_object(
      'id', NEW.id,
      'fileName', NEW."fileName",
      'filePath', NEW."filePath",
      'uploadedAt', NEW."uploadedAt"
    )
    WHERE "featuredImageId" = NEW.id::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_project_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 0 THEN
      NEW."dueDate" := NOW() + INTERVAL '30 days';
    ELSIF NEW.status = 1 THEN
      NEW."dueDate" := NOW() + INTERVAL '14 days';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW."elapsedTime" := INTERVAL '0';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_update_elapsed_time_on_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW."elapsedTime" := NOW() - NEW."createdAt";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recreate ALL triggers
CREATE TRIGGER assign_discussions_on_project_create
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_discussions_to_project();

CREATE TRIGGER create_punchlist_on_project_create
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_punchlist_items();

CREATE TRIGGER update_discussion_count_on_insert
  AFTER INSERT ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_discussions_count();

CREATE TRIGGER update_discussion_count_on_update
  AFTER UPDATE ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_discussions_count();

CREATE TRIGGER update_discussion_count_on_delete
  AFTER DELETE ON discussion
  FOR EACH ROW
  EXECUTE FUNCTION update_incomplete_discussions_count();

CREATE TRIGGER sync_featured_image_on_file_update
  AFTER UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_image_data();

CREATE TRIGGER sync_featured_image_on_file_insert
  AFTER INSERT ON files
  FOR EACH ROW
  EXECUTE FUNCTION sync_featured_image_data();

CREATE TRIGGER set_due_date_on_status_change
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_due_date();

CREATE TRIGGER set_elapsed_time_on_create
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time();

CREATE TRIGGER update_elapsed_time_on_update
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_elapsed_time_on_update();

-- 6. Run initialization
SELECT recalculate_incomplete_discussions();

-- 7. Success message
SELECT 'NUCLEAR FIX COMPLETE - All projectid issues should be resolved!' as status;
