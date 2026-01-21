-- ============================================================================
-- MIGRATION: Copy bannerAlerts table from Rothco to Capco
-- ============================================================================
-- Source: Rothco Supabase
-- Target: Capco Supabase
-- Created: 2025-01-13
-- ============================================================================

-- Step 1: Create the bannerAlerts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public."bannerAlerts" (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'info'::text,
    "position" TEXT DEFAULT 'top'::text,
    "expireMs" INTEGER,
    dismissible BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "startDate" TIMESTAMP WITH TIME ZONE,
    "endDate" TIMESTAMP WITH TIME ZONE,
    "createdBy" UUID,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Add constraints
-- ============================================================================

-- Type constraint: must be one of: info, success, warning, error
ALTER TABLE public."bannerAlerts"
    ADD CONSTRAINT "bannerAlerts_type_check" 
    CHECK (type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text]));

-- Position constraint: must be either top or bottom
ALTER TABLE public."bannerAlerts"
    ADD CONSTRAINT "bannerAlerts_position_check" 
    CHECK ("position" = ANY (ARRAY['top'::text, 'bottom'::text]));

-- Foreign key to auth.users
ALTER TABLE public."bannerAlerts"
    ADD CONSTRAINT "bannerAlerts_createdBy_fkey" 
    FOREIGN KEY ("createdBy") REFERENCES auth.users(id);

-- Step 3: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS "bannerAlerts_isActive_idx" 
    ON public."bannerAlerts"("isActive");

CREATE INDEX IF NOT EXISTS "bannerAlerts_startDate_endDate_idx" 
    ON public."bannerAlerts"("startDate", "endDate");

CREATE INDEX IF NOT EXISTS "bannerAlerts_createdBy_idx" 
    ON public."bannerAlerts"("createdBy");

-- Step 4: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public."bannerAlerts" ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- ============================================================================

-- Policy: Allow all authenticated users to view active banner alerts
CREATE POLICY "Anyone can view active banner alerts"
    ON public."bannerAlerts"
    FOR SELECT
    TO authenticated
    USING ("isActive" = true);

-- Policy: Allow admins to view all banner alerts (including inactive)
CREATE POLICY "Admins can view all banner alerts"
    ON public."bannerAlerts"
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Policy: Allow admins to insert banner alerts
CREATE POLICY "Admins can create banner alerts"
    ON public."bannerAlerts"
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Policy: Allow admins to update banner alerts
CREATE POLICY "Admins can update banner alerts"
    ON public."bannerAlerts"
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Policy: Allow admins to delete banner alerts
CREATE POLICY "Admins can delete banner alerts"
    ON public."bannerAlerts"
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'Admin'
        )
    );

-- Step 6: Add table and column comments
-- ============================================================================

COMMENT ON TABLE public."bannerAlerts" IS 
    'Stores banner alerts that appear at the top or bottom of pages. Used for site-wide announcements, maintenance notices, etc.';

COMMENT ON COLUMN public."bannerAlerts".id IS 
    'Primary key';

COMMENT ON COLUMN public."bannerAlerts".title IS 
    'Alert title/heading - required';

COMMENT ON COLUMN public."bannerAlerts".description IS 
    'Optional detailed description or message for the alert';

COMMENT ON COLUMN public."bannerAlerts".type IS 
    'Alert type: info (blue), success (green), warning (yellow), or error (red)';

COMMENT ON COLUMN public."bannerAlerts"."position" IS 
    'Display position: top (above header) or bottom (above footer)';

COMMENT ON COLUMN public."bannerAlerts"."expireMs" IS 
    'Auto-dismiss after this many milliseconds. NULL = no auto-dismiss';

COMMENT ON COLUMN public."bannerAlerts".dismissible IS 
    'Whether users can manually dismiss the alert with an X button';

COMMENT ON COLUMN public."bannerAlerts"."isActive" IS 
    'Whether the alert is currently active and should be displayed';

COMMENT ON COLUMN public."bannerAlerts"."startDate" IS 
    'Optional: Only show alert starting from this date/time';

COMMENT ON COLUMN public."bannerAlerts"."endDate" IS 
    'Optional: Hide alert after this date/time';

COMMENT ON COLUMN public."bannerAlerts"."createdBy" IS 
    'UUID of the user (admin) who created this alert';

COMMENT ON COLUMN public."bannerAlerts"."createdAt" IS 
    'Timestamp when the alert was created';

COMMENT ON COLUMN public."bannerAlerts"."updatedAt" IS 
    'Timestamp when the alert was last updated';

-- Step 7: Insert sample data (optional - remove if not needed)
-- ============================================================================

-- Example: Welcome banner
-- INSERT INTO public."bannerAlerts" (
--     title,
--     description,
--     type,
--     "position",
--     dismissible,
--     "isActive"
-- ) VALUES (
--     'Welcome to Our Platform',
--     'Thank you for choosing our fire protection services. Get started by creating your first project.',
--     'info',
--     'top',
--     true,
--     true
-- );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Usage Instructions:
-- 1. Go to Capco Supabase Dashboard → SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" to execute
-- 4. Verify table was created: Check Table Editor → bannerAlerts
-- 
-- To verify RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'bannerAlerts';
-- 
-- ============================================================================
