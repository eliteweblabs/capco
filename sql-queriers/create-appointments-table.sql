-- Create appointments table for Cal.com integration
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    cal_id INTEGER UNIQUE, -- Cal.com appointment ID
    cal_uid VARCHAR(255) UNIQUE, -- Cal.com UID for webhook matching
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    time_zone VARCHAR(100) DEFAULT 'UTC',
    attendee_email VARCHAR(255) NOT NULL,
    attendee_name VARCHAR(255) NOT NULL,
    location TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('ACCEPTED', 'PENDING', 'CANCELLED', 'REJECTED', 'CONFIRMED')),
    event_type VARCHAR(255) DEFAULT 'General Appointment',
    event_type_slug VARCHAR(255) DEFAULT 'general',
    duration INTEGER DEFAULT 60, -- Duration in minutes
    host_name VARCHAR(255) DEFAULT 'System',
    host_email VARCHAR(255) DEFAULT 'system@example.com',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_cal_id ON appointments(cal_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cal_uid ON appointments(cal_uid);
CREATE INDEX IF NOT EXISTS idx_appointments_attendee_email ON appointments(attendee_email);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_event_type ON appointments(event_type);

-- Create RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own appointments
CREATE POLICY "Users can view their own appointments" ON appointments
    FOR SELECT USING (attendee_email = auth.jwt() ->> 'email');

-- Policy: Users can insert their own appointments
CREATE POLICY "Users can insert their own appointments" ON appointments
    FOR INSERT WITH CHECK (attendee_email = auth.jwt() ->> 'email');

-- Policy: Users can update their own appointments
CREATE POLICY "Users can update their own appointments" ON appointments
    FOR UPDATE USING (attendee_email = auth.jwt() ->> 'email');

-- Policy: Users can delete their own appointments
CREATE POLICY "Users can delete their own appointments" ON appointments
    FOR DELETE USING (attendee_email = auth.jwt() ->> 'email');

-- Policy: Admins can view all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('Admin', 'Staff')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Insert sample data for testing
INSERT INTO appointments (
    cal_id,
    cal_uid,
    title,
    description,
    start_time,
    end_time,
    time_zone,
    attendee_email,
    attendee_name,
    location,
    status,
    event_type,
    event_type_slug,
    duration,
    host_name,
    host_email,
    metadata
) VALUES (
    1001,
    'sample-appointment-001',
    'Initial Consultation',
    'First meeting to discuss project requirements',
    '2024-01-15 10:00:00+00',
    '2024-01-15 11:00:00+00',
    'UTC',
    'client@example.com',
    'John Doe',
    'Conference Room A',
    'ACCEPTED',
    'Consultation',
    'consultation',
    60,
    'Jane Smith',
    'jane@company.com',
    '{"source": "cal.com", "priority": "high"}'
) ON CONFLICT (cal_id) DO NOTHING;

-- Create view for AI agent to easily query appointments
CREATE OR REPLACE VIEW ai_appointments_view AS
SELECT 
    id,
    cal_id,
    cal_uid,
    title,
    description,
    start_time,
    end_time,
    time_zone,
    attendee_email,
    attendee_name,
    location,
    status,
    event_type,
    event_type_slug,
    duration,
    host_name,
    host_email,
    metadata,
    created_at,
    updated_at,
    -- Computed fields for AI agent
    EXTRACT(EPOCH FROM (end_time - start_time))/60 as duration_minutes,
    TO_CHAR(start_time, 'YYYY-MM-DD') as date,
    TO_CHAR(start_time, 'HH24:MI') as time,
    CASE 
        WHEN start_time > NOW() THEN 'upcoming'
        WHEN end_time < NOW() THEN 'past'
        ELSE 'current'
    END as appointment_status
FROM appointments
ORDER BY start_time DESC;

-- Grant access to the view
GRANT SELECT ON ai_appointments_view TO authenticated;
GRANT SELECT ON ai_appointments_view TO anon;
