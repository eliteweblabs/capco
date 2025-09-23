  -- =====================================================
  -- CREATE DEMO PROJECTS: Using Existing Users Only
  -- This script creates demo projects using existing users
  -- =====================================================

  -- Get existing users to create demo projects for
  WITH demo_users AS (
    SELECT id, company_name, name
    FROM profiles 
    WHERE role = 'Client'
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
      WHEN du.company_name ILIKE '%acme%' OR du.company_name ILIKE '%construction%' THEN '123 Boylston Street, Boston, MA 02116'
      WHEN du.company_name ILIKE '%metro%' OR du.company_name ILIKE '%builders%' THEN '456 Newbury Street, Boston, MA 02115'
      WHEN du.company_name ILIKE '%urban%' OR du.company_name ILIKE '%development%' THEN '789 Tremont Street, Boston, MA 02118'
      WHEN du.company_name ILIKE '%premier%' OR du.company_name ILIKE '%properties%' THEN '321 Commonwealth Avenue, Boston, MA 02215'
      WHEN du.company_name ILIKE '%skyline%' THEN '654 Beacon Street, Boston, MA 02215'
      ELSE '123 Demo Street, Boston, MA 02116'  -- Fallback address
    END,
    CASE 
      WHEN du.company_name ILIKE '%acme%' THEN 10  -- New Project
      WHEN du.company_name ILIKE '%metro%' THEN 20    -- Documents Uploaded
      WHEN du.company_name ILIKE '%urban%' THEN 30  -- Under Review
      WHEN du.company_name ILIKE '%premier%' THEN 40 -- Proposal Sent
      WHEN du.company_name ILIKE '%skyline%' THEN 50 -- Contract Signed
      ELSE 10  -- Default to New Project
    END,
    CASE 
      WHEN du.company_name ILIKE '%acme%' THEN 2500
      WHEN du.company_name ILIKE '%metro%' THEN 3200
      WHEN du.company_name ILIKE '%urban%' THEN 1800
      WHEN du.company_name ILIKE '%premier%' THEN 4500
      WHEN du.company_name ILIKE '%skyline%' THEN 2800
      ELSE 2000  -- Default square footage
    END,
    CASE 
      WHEN du.company_name ILIKE '%acme%' THEN true
      WHEN du.company_name ILIKE '%metro%' THEN false
      WHEN du.company_name ILIKE '%urban%' THEN true
      WHEN du.company_name ILIKE '%premier%' THEN false
      WHEN du.company_name ILIKE '%skyline%' THEN true
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
  );

  -- Create additional demo projects for some users (to show multiple projects per client)
  WITH demo_users AS (
    SELECT id, company_name, name
    FROM profiles 
    WHERE role = 'Client'
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
      WHEN du.company_name ILIKE '%acme%' THEN '789 Summer Street, Boston, MA 02110'
      WHEN du.company_name ILIKE '%metro%' THEN '321 State Street, Boston, MA 02109'
      WHEN du.company_name ILIKE '%urban%' THEN '654 Congress Street, Boston, MA 02210'
      ELSE '456 Demo Business Ave, Boston, MA 02110'  -- Fallback address
    END,
    CASE 
      WHEN du.company_name ILIKE '%acme%' THEN 20  -- Documents Uploaded
      WHEN du.company_name ILIKE '%metro%' THEN 30     -- Under Review
      WHEN du.company_name ILIKE '%urban%' THEN 40 -- Proposal Sent
      ELSE 20  -- Default status
    END,
    CASE 
      WHEN du.company_name ILIKE '%acme%' THEN 1500
      WHEN du.company_name ILIKE '%metro%' THEN 2200
      WHEN du.company_name ILIKE '%urban%' THEN 3500
      ELSE 2000  -- Default square footage
    END,
    CASE 
      WHEN du.company_name ILIKE '%acme%' THEN false
      WHEN du.company_name ILIKE '%metro%' THEN true
      WHEN du.company_name ILIKE '%urban%' THEN false
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
    AND p.address LIKE '%Summer Street%'  -- Check for this specific address
  );

  -- Create some demo discussions for the projects
  WITH demo_projects AS (
    SELECT p.id as project_id, p.author_id, p.company_name
    FROM projects p
    JOIN profiles pr ON p.author_id = pr.id
    WHERE p.title = 'Demo Project'
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
      WHEN dp.company_name ILIKE '%acme%' THEN 'Initial project discussion - looking forward to working with CAPCo on this fire protection system.'
      WHEN dp.company_name ILIKE '%metro%' THEN 'Project requirements have been submitted. Awaiting review and proposal.'
      WHEN dp.company_name ILIKE '%urban%' THEN 'All documents uploaded successfully. Ready for next steps.'
      WHEN dp.company_name ILIKE '%premier%' THEN 'Proposal received and under review. Will respond within 48 hours.'
      WHEN dp.company_name ILIKE '%skyline%' THEN 'Contract signed and project approved. Ready to begin implementation.'
      ELSE 'Demo project discussion - looking forward to working with CAPCo.'
    END,
    false,
    false,
    NOW() - (random() * INTERVAL '2 days'),
    NOW() - (random() * INTERVAL '2 days')
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
    WHERE p.title = 'Demo Project'
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
      WHEN dp.company_name ILIKE '%acme%' THEN 'Internal note: Client is very responsive and has clear requirements. Priority project.'
      WHEN dp.company_name ILIKE '%metro%' THEN 'Internal note: Large project with complex requirements. May need additional resources.'
      WHEN dp.company_name ILIKE '%urban%' THEN 'Internal note: Standard residential project. Should be straightforward to complete.'
      ELSE 'Internal note: Demo project for testing purposes.'
    END,
    true,
    false,
    NOW() - (random() * INTERVAL '1 day'),
    NOW() - (random() * INTERVAL '1 day')
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
    WHERE p.title = 'Demo Project'
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
      WHEN dp.company_name ILIKE '%acme%' THEN 'Review fire alarm system specifications'
      WHEN dp.company_name ILIKE '%metro%' THEN 'Verify sprinkler system coverage'
      WHEN dp.company_name ILIKE '%urban%' THEN 'Check emergency exit signage requirements'
      WHEN dp.company_name ILIKE '%premier%' THEN 'Confirm fire suppression system installation'
      ELSE 'Review fire protection system requirements'
    END,
    false,
    false,
    CASE 
      WHEN dp.company_name ILIKE '%acme%' THEN true
      WHEN dp.company_name ILIKE '%metro%' THEN false
      WHEN dp.company_name ILIKE '%urban%' THEN false
      WHEN dp.company_name ILIKE '%premier%' THEN true
      ELSE false
    END,
    dp.company_name,
    NOW() - (random() * INTERVAL '1 day'),
    NOW() - (random() * INTERVAL '1 day')
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
    WHERE p.title = 'Demo Project'
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
    NOW() - (random() * INTERVAL '1 day')
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
    NOW() - (random() * INTERVAL '1 day')
  FROM demo_projects dp
  WHERE NOT EXISTS (
    SELECT 1 FROM files f 
    WHERE f.project_id = dp.project_id 
    AND f.file_name = 'Fire Safety Report.pdf'
  );

  -- Display summary of created demo data
  SELECT 
    'Demo Data Creation Summary' as summary,
    (SELECT COUNT(*) FROM projects WHERE title = 'Demo Project') as demo_projects,
    (SELECT COUNT(*) FROM discussion d JOIN projects p ON d.project_id = p.id WHERE p.title = 'Demo Project') as demo_discussions,
    (SELECT COUNT(*) FROM punchlist pl JOIN projects p ON pl.project_id = p.id WHERE p.title = 'Demo Project') as demo_punchlist_items,
    (SELECT COUNT(*) FROM files f JOIN projects p ON f.project_id = p.id WHERE p.title = 'Demo Project') as demo_files;

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
  WHERE p.title = 'Demo Project'
  ORDER BY p.created_at DESC;
