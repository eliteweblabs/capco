-- Optional: RPC Function to get user emails by IDs
-- Run this SQL in your Supabase SQL Editor (AFTER you have real users assigned to projects)

-- Create RPC function to get user emails by IDs
CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;

-- Grant execute permission to service role  
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO service_role;

-- Test the function (replace with a real user ID from your auth.users table)
-- SELECT * FROM get_user_emails(ARRAY['your-user-id-here']::UUID[]);