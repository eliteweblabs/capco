-- Simple fix for incomplete discussions function

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_update_incomplete_discussions ON discussion;

-- Drop the function
DROP FUNCTION IF EXISTS update_incomplete_discussions_count();

-- Recreate the function with correct field names
CREATE OR REPLACE FUNCTION update_incomplete_discussions_count()
RETURNS TRIGGER 
AS $$
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

-- Recreate the trigger
CREATE TRIGGER trigger_update_incomplete_discussions
    AFTER INSERT OR UPDATE OR DELETE ON discussion
    FOR EACH ROW
    EXECUTE FUNCTION update_incomplete_discussions_count();
