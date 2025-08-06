-- Create RPC function to bypass RLS and get staff users
CREATE OR REPLACE FUNCTION get_staff_users_direct()
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
GRANT EXECUTE ON FUNCTION get_staff_users_direct() TO authenticated; 