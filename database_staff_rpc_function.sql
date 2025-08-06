-- Create RPC function to get staff users (bypasses RLS)
CREATE OR REPLACE FUNCTION get_staff_users()
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    role TEXT,
    created TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.phone,
        p.role,
        p.created
    FROM profiles p
    WHERE p.role = 'Staff'
    ORDER BY p.name ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_staff_users() TO authenticated;

-- Also create a function to check all profiles (for debugging)
CREATE OR REPLACE FUNCTION get_all_profiles()
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    role TEXT,
    created TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.phone,
        p.role,
        p.created
    FROM profiles p
    ORDER BY p.name ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_profiles() TO authenticated; 