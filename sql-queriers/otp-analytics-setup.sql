-- OTP Authentication Database Considerations
-- This file documents database-related aspects of OTP authentication

-- OTP authentication uses Supabase's built-in auth.users table and auth system
-- No additional tables are required for basic OTP functionality

-- However, you may want to track OTP usage for analytics/security:

-- Optional: Create a table to track OTP requests (for analytics)
CREATE TABLE IF NOT EXISTS public.otp_logs (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('send', 'verify', 'resend')),
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_otp_logs_email ON public.otp_logs(email);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON public.otp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_logs_user_id ON public.otp_logs(user_id);

-- Enable RLS
ALTER TABLE public.otp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view OTP logs
CREATE POLICY "Admin can view OTP logs" ON public.otp_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'Admin'
        )
    );

-- RLS Policy: System can insert OTP logs (using service role)
CREATE POLICY "System can insert OTP logs" ON public.otp_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Optional: Create a view for OTP analytics
CREATE OR REPLACE VIEW public.otp_analytics AS
SELECT
    DATE(created_at) as date,
    action,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE success = false) as failed_requests,
    COUNT(DISTINCT email) as unique_users,
    ROUND(
        (COUNT(*) FILTER (WHERE success = true)::numeric / COUNT(*)::numeric) * 100,
        2
    ) as success_rate_percentage
FROM public.otp_logs
GROUP BY DATE(created_at), action
ORDER BY date DESC, action;

-- Grant permissions
GRANT SELECT ON public.otp_analytics TO authenticated;

-- Function to clean up old OTP logs (optional, run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_otp_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete OTP logs older than 90 days
    DELETE FROM public.otp_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    RAISE NOTICE 'Cleaned up OTP logs older than 90 days';
END;
$$;

-- Optional: Create a scheduled job to clean up old logs
-- This requires pg_cron extension
-- SELECT cron.schedule(
--     'cleanup-otp-logs',
--     '0 2 * * 0',  -- Run every Sunday at 2 AM
--     'SELECT public.cleanup_old_otp_logs();'
-- );

COMMENT ON TABLE public.otp_logs IS 'Tracks OTP authentication requests for analytics and security monitoring';
COMMENT ON VIEW public.otp_analytics IS 'Provides aggregated statistics on OTP usage';
COMMENT ON FUNCTION public.cleanup_old_otp_logs() IS 'Removes OTP logs older than 90 days to keep the table size manageable';
