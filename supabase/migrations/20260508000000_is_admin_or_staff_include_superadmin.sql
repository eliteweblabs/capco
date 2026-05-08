-- Treat superAdmin like Admin/Staff for RLS helpers (profile updates, etc.)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('Admin', 'Staff', 'superAdmin')
  );
$$;
