-- Simple Appointments Schema for Vapi.ai Integration
-- This creates a minimal appointments table that works with your existing auth system

-- Create appointments table (simplified version)
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  cal_uid VARCHAR(255) UNIQUE NOT NULL,
  event_type_id INTEGER DEFAULT 1,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  organizer_id UUID NOT NULL, -- Use UUID to match your auth system
  organizer_name VARCHAR(255) NOT NULL,
  organizer_email VARCHAR(255) NOT NULL,
  attendees JSONB DEFAULT '[]',
  responses JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  paid BOOLEAN DEFAULT FALSE,
  payment_id VARCHAR(255),
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_organizer_id ON appointments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_cal_uid ON appointments(cal_uid);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies that work with your existing auth system
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR ALL USING (organizer_id = auth.uid());

-- Policy for admins to see all appointments (if you have an admin role)
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
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

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;

-- Create a simple event type (skip for now, we'll create it manually if needed)
-- INSERT INTO event_types (id, title, slug, description, length, owner_id, created_at, updated_at)
-- VALUES (1, 'General Appointment', 'general-appointment', 'A general appointment slot', 60, 
--         (SELECT id FROM auth.users LIMIT 1), NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- Create function to get appointments by date range
CREATE OR REPLACE FUNCTION get_appointments_by_date_range(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  cal_uid VARCHAR(255),
  title VARCHAR(500),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50),
  organizer_name VARCHAR(255),
  attendee_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.cal_uid,
    a.title,
    a.start_time,
    a.end_time,
    a.status,
    a.organizer_name,
    jsonb_array_length(a.attendees)::INTEGER as attendee_count
  FROM appointments a
  WHERE a.start_time >= start_date
    AND a.start_time <= end_date
    AND (user_id IS NULL OR a.organizer_id = user_id)
  ORDER BY a.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get appointment statistics
CREATE OR REPLACE FUNCTION get_appointment_stats(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  total_appointments INTEGER,
  confirmed_appointments INTEGER,
  cancelled_appointments INTEGER,
  pending_appointments INTEGER,
  total_revenue DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_appointments,
    COUNT(*) FILTER (WHERE status = 'ACCEPTED')::INTEGER as confirmed_appointments,
    COUNT(*) FILTER (WHERE status = 'CANCELLED')::INTEGER as cancelled_appointments,
    COUNT(*) FILTER (WHERE status = 'PENDING')::INTEGER as pending_appointments,
    COALESCE(SUM(CASE WHEN paid THEN 1 ELSE 0 END), 0)::DECIMAL as total_revenue
  FROM appointments
  WHERE start_time >= start_date AND start_time <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
