-- Auto-update punchlistComplete and punchlistCount when punchlist items change
-- This trigger keeps the projects table counts in sync with the punchlist table

-- Function to update punchlist counts for a project
CREATE OR REPLACE FUNCTION update_project_punchlist_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the project's punchlist counts
    UPDATE projects
    SET 
        "punchlistCount" = (
            SELECT COUNT(*)
            FROM punchlist
            WHERE "projectId" = COALESCE(NEW."projectId", OLD."projectId")
        ),
        "punchlistComplete" = (
            SELECT COUNT(*)
            FROM punchlist
            WHERE "projectId" = COALESCE(NEW."projectId", OLD."projectId")
              AND "markCompleted" = true
        )
    WHERE id = COALESCE(NEW."projectId", OLD."projectId");
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_punchlist_counts_insert ON punchlist;
DROP TRIGGER IF EXISTS update_punchlist_counts_update ON punchlist;
DROP TRIGGER IF EXISTS update_punchlist_counts_delete ON punchlist;

-- Trigger on INSERT
CREATE TRIGGER update_punchlist_counts_insert
    AFTER INSERT ON punchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_project_punchlist_counts();

-- Trigger on UPDATE
CREATE TRIGGER update_punchlist_counts_update
    AFTER UPDATE ON punchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_project_punchlist_counts();

-- Trigger on DELETE
CREATE TRIGGER update_punchlist_counts_delete
    AFTER DELETE ON punchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_project_punchlist_counts();

-- Initial sync: Update all existing projects with correct counts
UPDATE projects p
SET 
    "punchlistComplete" = COALESCE(stats.completed, 0),
    "punchlistCount" = COALESCE(stats.total, 0)
FROM (
    SELECT 
        "projectId",
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE "markCompleted" = true) AS completed
    FROM punchlist
    GROUP BY "projectId"
) AS stats
WHERE p.id = stats."projectId";

-- Set to 0 for projects with no punchlist items
UPDATE projects
SET 
    "punchlistComplete" = 0,
    "punchlistCount" = 0
WHERE id NOT IN (SELECT DISTINCT "projectId" FROM punchlist WHERE "projectId" IS NOT NULL);

-- Verify the sync
SELECT 
    p.id,
    p.address,
    p."punchlistComplete" AS complete,
    p."punchlistCount" AS total,
    COUNT(pl.id) AS verify_total,
    COUNT(pl.id) FILTER (WHERE pl."markCompleted" = true) AS verify_complete
FROM projects p
LEFT JOIN punchlist pl ON pl."projectId" = p.id
GROUP BY p.id, p.address, p."punchlistComplete", p."punchlistCount"
ORDER BY p.id;
