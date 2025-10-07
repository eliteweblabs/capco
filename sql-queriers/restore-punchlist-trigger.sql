-- First ensure the admin user exists
DO $$ 
BEGIN
    -- Check if admin user exists in auth.users
    IF NOT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17'
    ) THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            role
        ) VALUES (
            'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
            'admin@capcofire.com',
            '$2a$10$abcdefghijklmnopqrstuvwxyz123456',  -- This is a dummy hash
            NOW(),
            NOW(),
            NOW(),
            'authenticated'
        );
    END IF;

    -- Check if admin profile exists
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17'
    ) THEN
        -- Insert into profiles
        INSERT INTO profiles (
            id,
            first_name,
            last_name,
            company_name,
            email,
            role,
            created_at,
            updated_at
        ) VALUES (
            'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
            'CAPCo',
            'Admin',
            'CAPCo Fire',
            'admin@capcofire.com',
            'Admin',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Create the punchlist function
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
DECLARE
    admin_user_id UUID := 'bdaaa7d3-469d-4b1b-90d1-978e1be47a17';
    base_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Use current time as base, add seconds to ensure proper ordering
    base_time := NOW();

    -- Insert default punchlist items with incremental timestamps for proper ordering
    INSERT INTO punchlist (project_id, author_id, message, internal, mark_completed, company_name, created_at)
    VALUES 
    (project_id_param, admin_user_id, 'Receive CAD files from client / download from <a class="text-primary dark:text-primary-text" href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=documents">Documents</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '1 second'),
    (project_id_param, admin_user_id, 'Obtain fire hydrant flow test data', false, false, 'CAPCo Fire', base_time + INTERVAL '2 seconds'),
    (project_id_param, admin_user_id, 'Conduct design kickoff and review scope', false, false, 'CAPCo Fire', base_time + INTERVAL '3 seconds'),
    (project_id_param, admin_user_id, 'Coordinate with fire alarm designer', false, false, 'CAPCo Fire', base_time + INTERVAL '4 seconds'),
    (project_id_param, admin_user_id, 'Complete fire sprinkler layout design', false, false, 'CAPCo Fire', base_time + INTERVAL '5 seconds'),
    (project_id_param, admin_user_id, 'Perform hydraulic calculations', false, false, 'CAPCo Fire', base_time + INTERVAL '6 seconds'),
    (project_id_param, admin_user_id, 'Optimize pipe sizing for efficiency', false, false, 'CAPCo Fire', base_time + INTERVAL '7 seconds'),
    (project_id_param, admin_user_id, 'Add notes and leader callouts', false, false, 'CAPCo Fire', base_time + INTERVAL '8 seconds'),
    (project_id_param, admin_user_id, 'Add details and general notes', false, false, 'CAPCo Fire', base_time + INTERVAL '9 seconds'),
    (project_id_param, admin_user_id, 'Finalize design and apply titleblock', false, false, 'CAPCo Fire', base_time + INTERVAL '10 seconds'),
    (project_id_param, admin_user_id, 'Print drawings to PDF for submittal / upload to <a class="text-primary dark:text-primary-text" href="{{SITE_URL}}/project/{{PROJECT_ID}}?status=deliverables">Deliverables</a>', false, false, 'CAPCo Fire', base_time + INTERVAL '11 seconds');
    
    RAISE NOTICE 'Created default punchlist items for project %', project_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger function
CREATE OR REPLACE FUNCTION auto_create_punchlist_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the function to create default punchlist items
    PERFORM create_default_punchlist_items(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_punchlist ON projects;

-- Create trigger on projects table
CREATE TRIGGER trigger_auto_create_punchlist
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_punchlist_items();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_default_punchlist_items(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_punchlist_items(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION auto_create_punchlist_items() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_punchlist_items() TO service_role;