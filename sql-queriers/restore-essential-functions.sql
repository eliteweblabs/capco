-- Restore essential functions that were accidentally removed
-- These functions are necessary for the application to work properly

-- 1. Restore handle_new_user function (essential for user registration)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with email and default role
  INSERT INTO public.profiles (
    id, 
    email,
    role, 
    company_name,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    'Client', -- Default role for new users
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), NEW.email), -- Fall back to email if company_name is empty
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''), -- Extract from OAuth metadata if available
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''), -- Extract from OAuth metadata if available
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Restore get_recent_conversations function (for chat functionality)
CREATE OR REPLACE FUNCTION get_recent_conversations(user_id_param UUID, limit_param INTEGER DEFAULT 50)
RETURNS TABLE (
  id INTEGER,
  project_id INTEGER,
  author_id UUID,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.project_id,
    d.author_id,
    d.message,
    d.created_at,
    COALESCE(p.company_name, p.first_name || ' ' || p.last_name, 'Unknown') as author_name
  FROM discussion d
  LEFT JOIN profiles p ON d.author_id = p.id
  WHERE d.project_id IN (
    SELECT id FROM projects WHERE author_id = user_id_param
  )
  ORDER BY d.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Restore create_default_punchlist_items function (for project setup)
CREATE OR REPLACE FUNCTION create_default_punchlist_items(project_id_param INTEGER)
RETURNS void AS $$
BEGIN
  -- Insert default punchlist items for new projects
  INSERT INTO punchlist (
    project_id,
    author_id,
    item,
    description,
    priority,
    status,
    created_at,
    updated_at
  ) VALUES 
    (
      project_id_param,
      'bdaaa7d3-469d-4b1b-90d1-978e1be47a17', -- Default admin user
      'Initial Project Review',
      'Review project requirements and specifications',
      'High',
      'Pending',
      NOW(),
      NOW()
    ),
    (
      project_id_param,
      'bdaaa7d3-469d-4b1b-90d1-978e1be47a17',
      'Document Collection',
      'Collect all necessary project documents',
      'Medium',
      'Pending',
      NOW(),
      NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Restore get_file_checkout_status function (for file management)
CREATE OR REPLACE FUNCTION get_file_checkout_status(file_id_param INTEGER)
RETURNS TABLE (
  is_checked_out BOOLEAN,
  checked_out_by UUID,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  checked_out_by_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.is_checked_out,
    fc.checked_out_by,
    fc.checked_out_at,
    COALESCE(p.company_name, p.first_name || ' ' || p.last_name, 'Unknown') as checked_out_by_name
  FROM file_checkouts fc
  LEFT JOIN profiles p ON fc.checked_out_by = p.id
  WHERE fc.file_id = file_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_conversations(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_punchlist_items(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_file_checkout_status(INTEGER) TO authenticated;
