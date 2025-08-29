-- Add status visibility control to project_statuses table
-- This allows different statuses to be visible to different roles

-- Add visible_to_roles column to control which roles can see each status
ALTER TABLE project_statuses 
ADD COLUMN visible_to_roles JSONB DEFAULT '["admin", "staff", "client"]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN project_statuses.visible_to_roles IS 'Array of roles that can see this status (admin, staff, client)';

-- Update existing statuses with appropriate visibility
-- Client-visible statuses (basic workflow)
UPDATE project_statuses 
SET visible_to_roles = '["admin", "staff", "client"]'::jsonb 
WHERE code IN (0, 10, 20, 30, 220); -- New, Submitted, Under Review, Approved, Completed

-- Admin/Staff-only statuses (internal workflow)
UPDATE project_statuses 
SET visible_to_roles = '["admin", "staff"]'::jsonb 
WHERE code IN (40, 50, 60, 70, 80, 90, 100, 110); -- Internal processing statuses

-- Example: Add some admin-only statuses if they don't exist
INSERT INTO project_statuses (code, name, description, color, visible_to_roles) VALUES
(500, 'Internal Review', 'Internal admin review in progress', 'orange', '["admin"]'::jsonb),
(510, 'Quality Check', 'Quality assurance check', 'purple', '["admin", "staff"]'::jsonb),
(520, 'Client Follow-up Required', 'Waiting for client response', 'yellow', '["admin", "staff"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Show updated table structure
SELECT 
  code,
  name,
  visible_to_roles,
  description
FROM project_statuses 
ORDER BY code;
