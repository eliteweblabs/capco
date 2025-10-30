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
    SELECT author_id INTO project_author_id 
    FROM projects 
    WHERE id = project_id_param;
    
    -- Get the author's company name from profiles
    SELECT COALESCE(company_name, first_name || ' ' || last_name, 'Unknown User') 
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
    INSERT INTO punchlist (project_id, author_id, message, internal, mark_completed, company_name, created_at)
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
