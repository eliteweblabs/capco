-- =====================================================
-- CREATE DEMO DATA: Projects Only (Using Existing Users)
-- This script creates demo projects using existing users
-- =====================================================

-- First, let's get some existing users to create demo projects for
-- We'll use existing users and just update their company names to have "Demo " prefix

-- Update existing users to have demo company names (only if they don't already have demo names)
UPDATE profiles 
SET company_name = 'Demo ' || company_name
WHERE company_name NOT LIKE 'Demo %'
AND role = 'Client'
LIMIT 5;

-- Get the updated demo users
WITH demo_users AS (
  SELECT id, company_name, name
  FROM profiles 
  WHERE company_name LIKE 'Demo %'
  AND role = 'Client'
  ORDER BY created_at DESC
  LIMIT 5
)

-- Create demo projects (only if they don't already exist)
INSERT INTO projects (
  author_id,
  title,
  address,
  status,
  sq_ft,
  new_construction,
  company_name,
  created_at,
  updated_at
)
SELECT 
  du.id,
  'Demo Project',
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN '123 Main Street, Downtown, CA 90210'
    WHEN du.company_name = 'Demo Metro Builders' THEN '456 Oak Avenue, Midtown, CA 90211'
    WHEN du.company_name = 'Demo Urban Development' THEN '789 Pine Street, Uptown, CA 90212'
    WHEN du.company_name = 'Demo Premier Properties' THEN '321 Elm Drive, Westside, CA 90213'
    WHEN du.company_name = 'Demo Skyline Construction' THEN '654 Maple Lane, Eastside, CA 90214'
    ELSE '123 Demo Street, Demo City, CA 90210'  -- Fallback address
  END,
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN 10  -- New Project
    WHEN du.company_name = 'Demo Metro Builders' THEN 20    -- Documents Uploaded
    WHEN du.company_name = 'Demo Urban Development' THEN 30  -- Under Review
    WHEN du.company_name = 'Demo Premier Properties' THEN 40 -- Proposal Sent
    WHEN du.company_name = 'Demo Skyline Construction' THEN 50 -- Contract Signed
    ELSE 10  -- Default to New Project
  END,
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN 2500
    WHEN du.company_name = 'Demo Metro Builders' THEN 3200
    WHEN du.company_name = 'Demo Urban Development' THEN 1800
    WHEN du.company_name = 'Demo Premier Properties' THEN 4500
    WHEN du.company_name = 'Demo Skyline Construction' THEN 2800
    ELSE 2000  -- Default square footage
  END,
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN true
    WHEN du.company_name = 'Demo Metro Builders' THEN false
    WHEN du.company_name = 'Demo Urban Development' THEN true
    WHEN du.company_name = 'Demo Premier Properties' THEN false
    WHEN du.company_name = 'Demo Skyline Construction' THEN true
    ELSE true  -- Default to new construction
  END,
  du.company_name,
  -- Create projects within the last week with random times
  NOW() - (random() * INTERVAL '7 days'),
  NOW() - (random() * INTERVAL '7 days')
FROM demo_users du
WHERE NOT EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.author_id = du.id 
  AND p.title = 'Demo Project'
  AND p.company_name = du.company_name
);

-- Create additional demo projects for some users (to show multiple projects per client)
WITH demo_users AS (
  SELECT id, company_name, name
  FROM profiles 
  WHERE company_name LIKE 'Demo %'
  AND role = 'Client'
  ORDER BY created_at DESC
  LIMIT 3
)

INSERT INTO projects (
  author_id,
  title,
  address,
  status,
  sq_ft,
  new_construction,
  company_name,
  created_at,
  updated_at
)
SELECT 
  du.id,
  'Demo Project',
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN '789 Business Blvd, Industrial District, CA 90215'
    WHEN du.company_name = 'Demo Metro Builders' THEN '321 Commerce Street, Financial District, CA 90216'
    WHEN du.company_name = 'Demo Urban Development' THEN '654 Enterprise Avenue, Tech Hub, CA 90217'
    ELSE '456 Demo Business Ave, Demo District, CA 90215'  -- Fallback address
  END,
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN 20  -- Documents Uploaded
    WHEN du.company_name = 'Demo Metro Builders' THEN 30     -- Under Review
    WHEN du.company_name = 'Demo Urban Development' THEN 40 -- Proposal Sent
    ELSE 20  -- Default status
  END,
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN 1500
    WHEN du.company_name = 'Demo Metro Builders' THEN 2200
    WHEN du.company_name = 'Demo Urban Development' THEN 3500
    ELSE 2000  -- Default square footage
  END,
  CASE 
    WHEN du.company_name = 'Demo Acme Construction' THEN false
    WHEN du.company_name = 'Demo Metro Builders' THEN true
    WHEN du.company_name = 'Demo Urban Development' THEN false
    ELSE false  -- Default to existing construction
  END,
  du.company_name,
  -- Create these projects 2-4 days ago
  NOW() - (random() * INTERVAL '4 days' + INTERVAL '2 days'),
  NOW() - (random() * INTERVAL '4 days' + INTERVAL '2 days')
FROM demo_users du
WHERE NOT EXISTS (
  SELECT 1 FROM projects p 
  WHERE p.author_id = du.id 
  AND p.title = 'Demo Project'
  AND p.address LIKE '%Business Blvd%'  -- Check for this specific address
);

-- Create some demo discussions for the projects
WITH demo_projects AS (
  SELECT p.id as project_id, p.author_id, p.company_name
  FROM projects p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.company_name LIKE 'Demo %'
  ORDER BY p.created_at DESC
  LIMIT 5
)

INSERT INTO discussion (
  project_id,
  author_id,
  message,
  internal,
  sms_alert,
  created_at,
  updated_at
)
SELECT 
  dp.project_id,
  dp.author_id,
  CASE 
    WHEN dp.company_name = 'Demo Acme Construction' THEN 'Initial project discussion - looking forward to working with CAPCo on this fire protection system.'
    WHEN dp.company_name = 'Demo Metro Builders' THEN 'Project requirements have been submitted. Awaiting review and proposal.'
    WHEN dp.company_name = 'Demo Urban Development' THEN 'All documents uploaded successfully. Ready for next steps.'
    WHEN dp.company_name = 'Demo Premier Properties' THEN 'Proposal received and under review. Will respond within 48 hours.'
    WHEN dp.company_name = 'Demo Skyline Construction' THEN 'Contract signed and project approved. Ready to begin implementation.'
    ELSE 'Demo project discussion - looking forward to working with CAPCo.'
  END,
  false,
  false,
  dp.project_id::text::timestamp + (random() * INTERVAL '2 days'),
  dp.project_id::text::timestamp + (random() * INTERVAL '2 days')
FROM demo_projects dp
WHERE NOT EXISTS (
  SELECT 1 FROM discussion d 
  WHERE d.project_id = dp.project_id 
  AND d.message LIKE '%Demo project discussion%'
);

-- Create some internal admin discussions
WITH demo_projects AS (
  SELECT p.id as project_id, p.author_id, p.company_name
  FROM projects p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.company_name LIKE 'Demo %'
  ORDER BY p.created_at DESC
  LIMIT 3
),
admin_user AS (
  SELECT id FROM profiles WHERE role = 'Admin' LIMIT 1
)

INSERT INTO discussion (
  project_id,
  author_id,
  message,
  internal,
  sms_alert,
  created_at,
  updated_at
)
SELECT 
  dp.project_id,
  au.id,
  CASE 
    WHEN dp.company_name = 'Demo Acme Construction' THEN 'Internal note: Client is very responsive and has clear requirements. Priority project.'
    WHEN dp.company_name = 'Demo Metro Builders' THEN 'Internal note: Large project with complex requirements. May need additional resources.'
    WHEN dp.company_name = 'Demo Urban Development' THEN 'Internal note: Standard residential project. Should be straightforward to complete.'
    ELSE 'Internal note: Demo project for testing purposes.'
  END,
  true,
  false,
  dp.project_id::text::timestamp + (random() * INTERVAL '1 day'),
  dp.project_id::text::timestamp + (random() * INTERVAL '1 day')
FROM demo_projects dp, admin_user au
WHERE au.id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM discussion d 
  WHERE d.project_id = dp.project_id 
  AND d.internal = true
  AND d.message LIKE '%Internal note%'
);

-- Create some demo punchlist items
WITH demo_projects AS (
  SELECT p.id as project_id, p.author_id, p.company_name
  FROM projects p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.company_name LIKE 'Demo %'
  AND p.status >= 20  -- Only for projects that have documents uploaded
  ORDER BY p.created_at DESC
  LIMIT 4
)

INSERT INTO punchlist (
  project_id,
  author_id,
  message,
  internal,
  sms_alert,
  mark_completed,
  company_name,
  created_at,
  updated_at
)
SELECT 
  dp.project_id,
  dp.author_id,
  CASE 
    WHEN dp.company_name = 'Demo Acme Construction' THEN 'Review fire alarm system specifications'
    WHEN dp.company_name = 'Demo Metro Builders' THEN 'Verify sprinkler system coverage'
    WHEN dp.company_name = 'Demo Urban Development' THEN 'Check emergency exit signage requirements'
    WHEN dp.company_name = 'Demo Premier Properties' THEN 'Confirm fire suppression system installation'
    ELSE 'Review fire protection system requirements'
  END,
  false,
  false,
  CASE 
    WHEN dp.company_name = 'Demo Acme Construction' THEN true
    WHEN dp.company_name = 'Demo Metro Builders' THEN false
    WHEN dp.company_name = 'Demo Urban Development' THEN false
    WHEN dp.company_name = 'Demo Premier Properties' THEN true
    ELSE false
  END,
  dp.company_name,
  dp.project_id::text::timestamp + (random() * INTERVAL '1 day'),
  dp.project_id::text::timestamp + (random() * INTERVAL '1 day')
FROM demo_projects dp
WHERE NOT EXISTS (
  SELECT 1 FROM punchlist pl 
  WHERE pl.project_id = dp.project_id 
  AND pl.message LIKE '%fire protection system%'
);

-- Create some demo files (references to files that would be uploaded)
WITH demo_projects AS (
  SELECT p.id as project_id, p.author_id, p.company_name
  FROM projects p
  JOIN profiles pr ON p.author_id = pr.id
  WHERE p.company_name LIKE 'Demo %'
  ORDER BY p.created_at DESC
  LIMIT 3
)

INSERT INTO files (
  project_id,
  author_id,
  file_path,
  file_name,
  file_size,
  file_type,
  status,
  uploaded_at
)
SELECT 
  dp.project_id,
  dp.author_id,
  'demo-files/' || dp.project_id || '/building-plans.pdf',
  'Building Plans.pdf',
  2048576, -- 2MB
  'application/pdf',
  'active',
  dp.project_id::text::timestamp + (random() * INTERVAL '1 day')
FROM demo_projects dp
WHERE NOT EXISTS (
  SELECT 1 FROM files f 
  WHERE f.project_id = dp.project_id 
  AND f.file_name = 'Building Plans.pdf'
)

UNION ALL

SELECT 
  dp.project_id,
  dp.author_id,
  'demo-files/' || dp.project_id || '/fire-safety-report.pdf',
  'Fire Safety Report.pdf',
  1536000, -- 1.5MB
  'application/pdf',
  'active',
  dp.project_id::text::timestamp + (random() * INTERVAL '1 day')
FROM demo_projects dp
WHERE NOT EXISTS (
  SELECT 1 FROM files f 
  WHERE f.project_id = dp.project_id 
  AND f.file_name = 'Fire Safety Report.pdf'
);

-- Display summary of created demo data
SELECT 
  'Demo Data Creation Summary' as summary,
  (SELECT COUNT(*) FROM profiles WHERE company_name LIKE 'Demo %') as demo_users,
  (SELECT COUNT(*) FROM projects WHERE company_name LIKE 'Demo %') as demo_projects,
  (SELECT COUNT(*) FROM discussion d JOIN projects p ON d.project_id = p.id WHERE p.company_name LIKE 'Demo %') as demo_discussions,
  (SELECT COUNT(*) FROM punchlist pl JOIN projects p ON pl.project_id = p.id WHERE p.company_name LIKE 'Demo %') as demo_punchlist_items,
  (SELECT COUNT(*) FROM files f JOIN projects p ON f.project_id = p.id WHERE p.company_name LIKE 'Demo %') as demo_files;

-- Show the created demo projects
SELECT 
  p.id,
  p.title,
  p.address,
  p.status,
  p.sq_ft,
  p.new_construction,
  p.company_name,
  p.created_at,
  pr.name as author_name,
  pr.email as author_email
FROM projects p
JOIN profiles pr ON p.author_id = pr.id
WHERE p.company_name LIKE 'Demo %'
ORDER BY p.created_at DESC;
