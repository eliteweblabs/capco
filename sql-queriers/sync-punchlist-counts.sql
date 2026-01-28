-- Sync punchlistComplete and punchlistCount columns with actual punchlist data
-- This updates the projects table to have accurate counts from the punchlist table

-- First, let's see what the current state is
SELECT 
    p.id,
    p.address,
    p.punchlistComplete AS "stored_complete",
    p.punchlistCount AS "stored_total",
    COUNT(pl.id) AS "actual_total",
    COUNT(pl.id) FILTER (WHERE pl."markCompleted" = true) AS "actual_complete"
FROM projects p
LEFT JOIN punchlist pl ON pl."projectId" = p.id
GROUP BY p.id, p.address, p.punchlistComplete, p.punchlistCount
ORDER BY p.id;

-- Now update the projects table with accurate counts
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
WHERE id NOT IN (SELECT DISTINCT "projectId" FROM punchlist)
  AND ("punchlistComplete" IS NULL OR "punchlistCount" IS NULL);

-- Verify the update
SELECT 
    p.id,
    p.address,
    p.punchlistComplete AS "complete",
    p.punchlistCount AS "total",
    COUNT(pl.id) AS "verify_total",
    COUNT(pl.id) FILTER (WHERE pl."markCompleted" = true) AS "verify_complete"
FROM projects p
LEFT JOIN punchlist pl ON pl."projectId" = p.id
GROUP BY p.id, p.address, p.punchlistComplete, p.punchlistCount
ORDER BY p.id;
