-- Fix Punchlist Item Ordering
-- This script ensures punchlist items are inserted in the correct order

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
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '1 second'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Obtain fire hydrant flow test data', false, false, 'CAPCo Fire', base_time + INTERVAL '2 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Conduct design kickoff and review scope', false, false, 'CAPCo Fire', base_time + INTERVAL '3 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Coordinate with fire alarm designer', false, false, 'CAPCo Fire', base_time + INTERVAL '4 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Complete fire sprinkler layout design', false, false, 'CAPCo Fire', base_time + INTERVAL '5 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Perform hydraulic calculations', false, false, 'CAPCo Fire', base_time + INTERVAL '6 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Optimize pipe sizing for efficiency', false, false, 'CAPCo Fire', base_time + INTERVAL '7 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Add notes and leader callouts', false, false, 'CAPCo Fire', base_time + INTERVAL '8 seconds'),  
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Add details and general notes', false, false, 'CAPCo Fire', base_time + INTERVAL '9 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Finalize design and apply titleblock', false, false, 'CAPCo Fire', base_time + INTERVAL '10 seconds'),
     (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{RAILWAY_PUBLIC_DOMAIN}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '11 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- AUTO CREATE PUNCHLIST TRIGGER FUNCTION
-- ==============================================

-- Function to automatically create default punchlist items for new projects
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the function to create default punchlist items
    PERFORM create_default_punchlist_items(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trigger_auto_create_punchlist ON projects;
CREATE TRIGGER trigger_auto_create_punchlist
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_punchlist_items();

-- ==============================================
-- PUNCHLIST COUNT UPDATE FUNCTION
-- ==============================================

-- Function to update punchlist counts on projects table
CREATE OR REPLACE FUNCTION update_punchlist_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Handle INSERT, UPDATE, and DELETE operations
    IF TG_OP = 'INSERT' THEN
        -- New punchlist item added - increment count if not completed
        IF NEW."markCompleted" IS NULL OR NOT NEW."markCompleted" THEN
            UPDATE projects 
            SET "punchlistCount" = COALESCE("punchlistCount", 0) + 1
            WHERE id = NEW."projectId";
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Punchlist item updated - adjust count based on markCompleted changes
        IF (OLD."markCompleted" IS NULL OR NOT OLD."markCompleted") != (NEW."markCompleted" IS NULL OR NOT NEW."markCompleted") THEN
            IF NEW."markCompleted" IS NOT NULL AND NEW."markCompleted" THEN
                -- Marked as completed - decrement count
                UPDATE projects 
                SET "punchlistCount" = GREATEST(COALESCE("punchlistCount", 0) - 1, 0)
                WHERE id = NEW."projectId";
            ELSE
                -- Marked as incomplete (including NULL) - increment count
                UPDATE projects 
                SET "punchlistCount" = COALESCE("punchlistCount", 0) + 1
                WHERE id = NEW."projectId";
            END IF;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Punchlist item deleted - decrement count if it was incomplete
        IF OLD."markCompleted" IS NULL OR NOT OLD."markCompleted" THEN
            UPDATE projects 
            SET "punchlistCount" = GREATEST(COALESCE("punchlistCount", 0) - 1, 0)
            WHERE id = OLD."projectId";
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for punchlist count updates
DROP TRIGGER IF EXISTS trigger_update_punchlist_count ON punchlist;
CREATE TRIGGER trigger_update_punchlist_count
    AFTER INSERT OR UPDATE OR DELETE ON punchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_punchlist_count();

-- Add documentation
COMMENT ON FUNCTION auto_create_punchlist_items() IS 
'Automatically creates default punchlist items when a new project is created.';

COMMENT ON FUNCTION update_punchlist_count() IS 
'Updates punchlist count on projects table when punchlist items are inserted, updated, or deleted.';

COMMENT ON TRIGGER trigger_auto_create_punchlist ON projects IS 
'Automatically creates punchlist items when a new project is created.';

COMMENT ON TRIGGER trigger_update_punchlist_count ON punchlist IS 
'Automatically updates punchlist count when punchlist items change.';
