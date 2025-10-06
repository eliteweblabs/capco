-- =====================================================
-- FIX REMAINING SNAKE_CASE FUNCTIONS
-- =====================================================
-- This script fixes all the functions that still have snake_case field references
-- =====================================================

-- 1. Fix assign_default_discussions_to_existing_project function
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
    ),
    (
      project_record.id,
      project_record."authorId",
      'Project Kickoff Checklist:
      ✓ Project created and documented
      ✓ Client notified
      ⏳ Site visit scheduled
      ⏳ Initial proposal prepared
      ⏳ Team assigned',
      true,
      NOW(),
      NOW(),
      false
    ),
    (
      project_record.id,
      project_record."authorId",
      'Next Steps for Client:
      1. We will schedule a site visit within 2-3 business days
      2. Our team will prepare a detailed proposal based on your requirements
      3. You will receive updates via email
      4. Feel free to reach out with any questions',
      false,
      NOW(),
      NOW(),
      false
    );
    
  RAISE NOTICE 'Default discussions assigned to project %', project_id_param;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix create_default_punchlist_items function
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
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '1 second'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Obtain fire hydrant flow test data', false, false, 'CAPCo Fire', base_time + INTERVAL '2 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Conduct design kickoff and review scope', false, false, 'CAPCo Fire', base_time + INTERVAL '3 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Coordinate with fire alarm designer', false, false, 'CAPCo Fire', base_time + INTERVAL '4 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Complete fire sprinkler layout design', false, false, 'CAPCo Fire', base_time + INTERVAL '5 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Perform hydraulic calculations', false, false, 'CAPCo Fire', base_time + INTERVAL '6 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Optimize pipe sizing for efficiency', false, false, 'CAPCo Fire', base_time + INTERVAL '7 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Add notes and leader callouts', false, false, 'CAPCo Fire', base_time + INTERVAL '8 seconds'),  
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Add details and general notes', false, false, 'CAPCo Fire', base_time + INTERVAL '9 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Finalize design and apply titleblock', false, false, 'CAPCo Fire', base_time + INTERVAL '10 seconds'),
    (project_id_param, 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '11 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project % with author %', project_id_param, project_author_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Fix extend_project_due_date function
CREATE OR REPLACE FUNCTION extend_project_due_date(project_id_param INTEGER, hours_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = COALESCE("dueDate", NOW()) + (hours_to_add || ' hours')::INTERVAL
  WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix reset_project_due_date function
CREATE OR REPLACE FUNCTION reset_project_due_date(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = NOW() + INTERVAL '48 hours'
  WHERE id = project_id_param;
END;
$$ LANGUAGE plpgsql;

-- 5. Fix update_missing_due_dates function
CREATE OR REPLACE FUNCTION update_missing_due_dates()
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = "createdAt" + INTERVAL '48 hours'
  WHERE "dueDate" IS NULL AND "createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Fix update_single_project_due_date function
CREATE OR REPLACE FUNCTION update_single_project_due_date(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE projects 
  SET "dueDate" = "createdAt" + INTERVAL '48 hours'
  WHERE id = project_id_param AND "createdAt" IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Fix update_tutorial_configs_updated_at function
CREATE OR REPLACE FUNCTION update_tutorial_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Fix get_conversation function (if it exists)
DROP FUNCTION IF EXISTS get_conversation(UUID, UUID, INTEGER);
CREATE OR REPLACE FUNCTION get_conversation(user1_id UUID, user2_id UUID, limit_count INTEGER)
RETURNS TABLE (
  id INTEGER,
  from_user UUID,
  from_name TEXT,
  to_user UUID,
  message TEXT,
  message_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dm.id,
    dm."fromUser",
    dm."fromName",
    dm."toUser",
    dm.message,
    dm."messageTimestamp",
    dm."createdAt",
    dm."readAt"
  FROM direct_messages dm
  WHERE 
    dm."isDeleted" = FALSE
    AND (
      (dm."fromUser" = user1_id AND dm."toUser" = user2_id)
      OR (dm."fromUser" = user2_id AND dm."toUser" = user1_id)
    )
  ORDER BY dm."messageTimestamp" DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Fix recalculate_invoice_totals function
DROP FUNCTION IF EXISTS recalculate_invoice_totals();
CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate totals for the affected invoice
    UPDATE invoices 
    SET 
        subtotal = (
            SELECT COALESCE(SUM("totalPrice"), 0) 
            FROM invoice_line_items 
            WHERE "invoiceId" = COALESCE(NEW."invoiceId", OLD."invoiceId")
        ),
        "taxAmount" = ROUND((
            SELECT COALESCE(SUM("totalPrice"), 0) 
            FROM invoice_line_items 
            WHERE "invoiceId" = COALESCE(NEW."invoiceId", OLD."invoiceId")
        ) * COALESCE("taxRate", 0), 2),
        "totalAmount" = ROUND((
            SELECT COALESCE(SUM("totalPrice"), 0) 
            FROM invoice_line_items 
            WHERE "invoiceId" = COALESCE(NEW."invoiceId", OLD."invoiceId")
        ) * (1 + COALESCE("taxRate", 0)) - COALESCE("discountAmount", 0), 2),
        "updatedAt" = now()
    WHERE id = COALESCE(NEW."invoiceId", OLD."invoiceId");
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 10. Fix update_invoice_totals function
DROP FUNCTION IF EXISTS update_invoice_totals();
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices 
    SET 
        subtotal = (
            SELECT COALESCE(SUM("totalPrice"), 0) 
            FROM invoice_line_items 
            WHERE "invoiceId" = COALESCE(NEW."invoiceId", OLD."invoiceId")
        ),
        "taxAmount" = (
            SELECT COALESCE(SUM("totalPrice"), 0) * "taxRate" / 100
            FROM invoice_line_items 
            WHERE "invoiceId" = COALESCE(NEW."invoiceId", OLD."invoiceId")
        ),
        "totalAmount" = (
            SELECT COALESCE(SUM("totalPrice"), 0) * (1 + "taxRate" / 100)
            FROM invoice_line_items 
            WHERE "invoiceId" = COALESCE(NEW."invoiceId", OLD."invoiceId")
        ),
        "updatedAt" = NOW()
    WHERE id = COALESCE(NEW."invoiceId", OLD."invoiceId");
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'All remaining snake_case functions have been updated to camelCase!' as status;
