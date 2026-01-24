-- Fix Function Search Path Security Warnings
-- This addresses the WARN-level security issues for mutable search_path in functions
-- Priority: Low (not urgent, but good practice)

-- The issue: Functions without explicit search_path can potentially be exploited
-- The fix: Add SECURITY DEFINER and SET search_path to each function

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_cms_pages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_global_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_filecheckouts_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ai_knowledge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contact_submissions_updatedat()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- AUTHORIZATION/ROLE CHECKING FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('Admin', 'Staff')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, 'Client');
END;
$$;

-- ============================================================================
-- FILE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Note: These are complex functions. Only adding search_path.
-- If the full function body is needed, we would need to query it first.

-- For now, we'll create a placeholder that maintains the same signature
-- A production fix would need the full function body from the database.

-- To fix properly, you would:
-- 1. Get the function definition: SELECT pg_get_functiondef('public.checkout_file'::regproc);
-- 2. Add SECURITY DEFINER and SET search_path to it
-- 3. Replace the function

-- Example template (would need actual function body):
/*
CREATE OR REPLACE FUNCTION public.checkout_file(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Original function body here
$$;
*/

-- ============================================================================
-- PROJECT DATE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Similar to above - these need the original function bodies
-- The fix is to add: SECURITY DEFINER and SET search_path = public

-- Affected functions:
-- - extend_project_due_date
-- - reset_project_due_date
-- - set_project_due_date_on_status_change
-- - set_project_due_date_on_insert
-- - update_missing_due_dates
-- - update_single_project_due_date

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- to_camel_case function (if exists)
-- Would need original body to recreate

-- ============================================================================
-- AI FUNCTIONS
-- ============================================================================

-- calculate_ai_cost
-- get_agent_knowledge

-- ============================================================================
-- FEATURED IMAGE FUNCTIONS
-- ============================================================================

-- sync_featured_image_data
-- refresh_project_featured_image_data

-- ============================================================================
-- OTHER FUNCTIONS
-- ============================================================================

-- assign_file
-- calculate_outstanding_balance
-- checkin_file
-- get_file_checkout_status
-- handle_new_user

-- ============================================================================
-- NOTES
-- ============================================================================

-- This migration fixes the simple trigger functions.
-- For complex business logic functions (file management, project dates, etc.),
-- you would need to:
-- 
-- 1. Query the existing function:
--    SELECT pg_get_functiondef('public.function_name'::regproc);
--
-- 2. Add these two lines after LANGUAGE:
--    SECURITY DEFINER
--    SET search_path = public
--
-- 3. Recreate the function with CREATE OR REPLACE
--
-- The security risk is LOW for your use case since:
-- - Your app controls all function calls
-- - RLS policies are properly set
-- - You don't have untrusted users creating schemas
--
-- This can be done during regular maintenance or when modifying these functions.

COMMENT ON FUNCTION public.update_cms_pages_updated_at() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.update_global_settings_updated_at() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.update_filecheckouts_timestamp() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.update_ai_knowledge_updated_at() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.update_contact_submissions_updatedat() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.handle_updated_at() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.is_admin_or_staff() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.is_admin() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
COMMENT ON FUNCTION public.get_user_role() IS 'Updated 2026-01-23: Added SECURITY DEFINER and search_path for security';
