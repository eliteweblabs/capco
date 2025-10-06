-- =====================================================
-- FIND AND FIX ALL PROJECTID REFERENCES
-- =====================================================
-- This script finds ALL functions that reference projectid and fixes them
-- =====================================================

-- First, let's find all functions that might be causing the issue
SELECT 
    'FUNCTIONS WITH PROJECTID REFERENCES:' as info,
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%projectid%'
ORDER BY routine_name;

-- Now let's drop and recreate ALL functions that might be causing issues
-- This is a comprehensive approach to ensure we get everything

-- Drop all potentially problematic functions
DROP FUNCTION IF EXISTS assign_default_discussions_to_existing_project(INTEGER);
DROP FUNCTION IF EXISTS assign_default_discussions_to_project();
DROP FUNCTION IF EXISTS auto_create_punchlist_items();
DROP FUNCTION IF EXISTS create_default_punchlist_items(INTEGER);
DROP FUNCTION IF EXISTS update_incomplete_discussions_count();
DROP FUNCTION IF EXISTS recalculate_incomplete_discussions();

-- Recreate assign_default_discussions_to_project with correct field names
CREATE OR REPLACE FUNCTION assign_default_discussions_to_project()
RETURNS TRIGGER AS $$
BEGIN
  -- Create initial discussion threads for new projects
  INSERT INTO discussion ("projectId", "authorId", message, internal, "createdAt")
  VALUES 
    (NEW.id, NEW."authorId", 'Project created - Discussion thread started', true, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate auto_create_punchlist_items with correct field names
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
  -- Add default punchlist items for new projects
  INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "createdAt")
  VALUES 
    (NEW.id, NEW."authorId", 'Initial inspection checklist', true, false, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate update_incomplete_discussions_count with correct field names
CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT, UPDATE, and DELETE operations
    IF TG_OP = 'INSERT' THEN
        -- New discussion added - increment count if not completed (treat NULL as incomplete)
        IF NEW."markCompleted" IS NULL OR NOT NEW."markCompleted" THEN
            UPDATE projects 
            SET "incompleteDiscussions" = COALESCE("incompleteDiscussions", 0) + 1
            WHERE id = NEW."projectId";
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Discussion updated - adjust count based on markCompleted changes
        -- Treat NULL as incomplete (false)
        IF (OLD."markCompleted" IS NULL OR NOT OLD."markCompleted") != (NEW."markCompleted" IS NULL OR NOT NEW."markCompleted") THEN
            IF NEW."markCompleted" IS NOT NULL AND NEW."markCompleted" THEN
                -- Marked as completed - decrement count
                UPDATE projects 
                SET "incompleteDiscussions" = GREATEST(COALESCE("incompleteDiscussions", 0) - 1, 0)
                WHERE id = NEW."projectId";
            ELSE
                -- Marked as incomplete (including NULL) - increment count
                UPDATE projects 
                SET "incompleteDiscussions" = COALESCE("incompleteDiscussions", 0) + 1
                WHERE id = NEW."projectId";
            END IF;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Discussion deleted - decrement count if it was incomplete (treat NULL as incomplete)
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

-- Recreate recalculate_incomplete_discussions with correct field names
CREATE OR REPLACE FUNCTION recalculate_incomplete_discussions()
RETURNS void AS $$
BEGIN
    -- Update all projects with accurate incomplete discussions count
    -- Treat NULL markCompleted as incomplete
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

-- Recreate assign_default_discussions_to_existing_project with correct field names
CREATE OR REPLACE FUNCTION assign_default_discussions_to_existing_project(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
  project_record RECORD;
BEGIN
  -- Get the project details
  SELECT * INTO project_record FROM projects WHERE id = project_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project with ID % not found', project_id_param;
  END IF;
  
  -- Check if discussions already exist for this project
  IF EXISTS (SELECT 1 FROM discussion WHERE "projectId" = project_id_param) THEN
    RAISE NOTICE 'Project % already has discussions. Skipping default assignment.', project_id_param;
    RETURN;
  END IF;
  
  -- Insert default discussions
  INSERT INTO discussion (
    "projectId",
    "authorId",
    message,
    internal,
    "createdAt",
    "updatedAt",
    "markCompleted"
  ) VALUES 
    (
      project_record.id,
      project_record."authorId",
      'Welcome to your new project! We''re excited to work with you on ' || COALESCE(project_record.title, 'your project') || ' at ' || COALESCE(project_record.address, 'the specified location') || '. Our team will be in touch soon to discuss the next steps.',
      false,
      NOW(),
      NOW(),
      true
    ),
    (
      project_record.id,
      project_record."authorId",
      'New project created: ' || COALESCE(project_record.title, 'Untitled Project') || ' at ' || COALESCE(project_record.address, 'Unknown Address') || '. Please review project details and assign appropriate team members.',
      true,
      NOW(),
      NOW(),
      false
    );
    
  RAISE NOTICE 'Default discussions assigned to project %', project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Recreate create_default_punchlist_items with correct field names
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
    project_author_id UUID;
    author_company_name TEXT;
    base_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get the project author's ID and company name
    SELECT "authorId" INTO project_author_id 
    FROM projects 
    WHERE id = project_id_param;
    
    -- Get the author's company name from profiles
    SELECT COALESCE("companyName", "firstName" || ' ' || "lastName", 'Unknown User') 
    INTO author_company_name
    FROM profiles 
    WHERE id = project_author_id;
    
    -- If we couldn't find the author, exit
    IF project_author_id IS NULL THEN
        RAISE NOTICE 'Could not find author for project %', project_id_param;
        RETURN;
    END IF;

    -- Use current time as base, add seconds to ensure proper ordering
    base_time := NOW();

    -- Insert default punchlist items with incremental timestamps for proper ordering
    INSERT INTO punchlist ("projectId", "authorId", message, internal, "markCompleted", "companyName", "createdAt")
    VALUES 
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Receive CAD files from client', false, false, 'CAPCo Fire', base_time + INTERVAL '1 second'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Conduct design kickoff and review scope', false, false, 'CAPCo Fire', base_time + INTERVAL '2 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate all triggers to ensure they use the correct functions
DROP TRIGGER IF EXISTS assign_discussions_on_project_create ON projects;
DROP TRIGGER IF EXISTS create_punchlist_on_project_create ON projects;
DROP TRIGGER IF EXISTS update_discussion_count_on_insert ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_update ON discussion;
DROP TRIGGER IF EXISTS update_discussion_count_on_delete ON discussion;

-- Recreate triggers
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

-- Run the recalculation function to set initial values
SELECT recalculate_incomplete_discussions();

-- Success message
SELECT 'All projectid references have been fixed!' as status;
