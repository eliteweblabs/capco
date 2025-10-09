-- Create system project (ID 0) for logging system-wide activities
-- This project is used for logging activities that don't belong to a specific project

-- Insert system project if it doesn't exist
INSERT INTO projects (
  id,
  "authorId",
  title,
  address,
  description,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  0,
  '00000000-0000-0000-0000-000000000000', -- System UUID
  'System',
  'System Activities',
  'System project for logging global activities and notifications',
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update the sequence to start from 1 (since we manually inserted ID 0)
SELECT setval('projects_id_seq', 1, false);
