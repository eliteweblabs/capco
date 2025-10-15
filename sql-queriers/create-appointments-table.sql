-- Create appointments table for Cal.com integration
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  cal_uid VARCHAR(255) UNIQUE NOT NULL,
  event_type_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  organizer_id INTEGER NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_appointments_cal_uid ON appointments(cal_uid);
CREATE INDEX IF NOT EXISTS idx_appointments_organizer_id ON appointments(organizer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_event_type_id ON appointments(event_type_id);

-- Create RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy for organizers to see their own appointments
CREATE POLICY "Organizers can view their own appointments" ON appointments
  FOR SELECT USING (organizer_id = auth.uid()::integer);

-- Policy for admins to see all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Policy for staff to see appointments they're assigned to
CREATE POLICY "Staff can view assigned appointments" ON appointments
  FOR SELECT USING (
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

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Create function to handle appointment status changes
CREATE OR REPLACE FUNCTION handle_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  INSERT INTO appointment_logs (
    appointment_id,
    old_status,
    new_status,
    changed_at,
    changed_by
  ) VALUES (
    NEW.id,
    OLD.status,
    NEW.status,
    NOW(),
    auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create appointment_logs table
CREATE TABLE IF NOT EXISTS appointment_logs (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Create trigger for status changes
CREATE TRIGGER trigger_appointment_status_change
  AFTER UPDATE OF status ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_appointment_status_change();

-- Create view for appointment details with organizer info
CREATE OR REPLACE VIEW appointment_details AS
SELECT 
  a.*,
  p.first_name as organizer_first_name,
  p.last_name as organizer_last_name,
  p.company_name as organizer_company,
  p.phone as organizer_phone
FROM appointments a
LEFT JOIN profiles p ON p.id = a.organizer_id;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON appointments TO authenticated;
GRANT SELECT ON appointment_details TO authenticated;
GRANT SELECT, INSERT ON appointment_logs TO authenticated;

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
    AND (user_id IS NULL OR a.organizer_id = user_id::INTEGER)
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
    COUNT(*) FILTER (WHERE status = 'CONFIRMED')::INTEGER as confirmed_appointments,
    COUNT(*) FILTER (WHERE status = 'CANCELLED')::INTEGER as cancelled_appointments,
    COUNT(*) FILTER (WHERE status = 'PENDING')::INTEGER as pending_appointments,
    COALESCE(SUM(CASE WHEN paid THEN 1 ELSE 0 END), 0)::DECIMAL as total_revenue
  FROM appointments
  WHERE start_time >= start_date AND start_time <= end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;