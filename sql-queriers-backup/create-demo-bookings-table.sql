-- Create demo_bookings table for storing demo booking requests
-- This table will store all demo booking submissions from the website

CREATE TABLE IF NOT EXISTS public.demo_bookings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  message TEXT,
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_demo_bookings_email ON public.demo_bookings(email);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_status ON public.demo_bookings(status);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_date ON public.demo_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_demo_bookings_created_at ON public.demo_bookings(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_demo_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_demo_bookings_updated_at
  BEFORE UPDATE ON public.demo_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_bookings_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.demo_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Admins can see all demo bookings
CREATE POLICY "Admins can view all demo bookings" ON public.demo_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Admins can insert demo bookings (for manual entries)
CREATE POLICY "Admins can insert demo bookings" ON public.demo_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Admins can update demo bookings
CREATE POLICY "Admins can update demo bookings" ON public.demo_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Allow anonymous users to insert demo bookings (for the public form)
CREATE POLICY "Anonymous users can insert demo bookings" ON public.demo_bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.demo_bookings IS 'Stores demo booking requests from the public website';
COMMENT ON COLUMN public.demo_bookings.status IS 'Booking status: pending, confirmed, completed, cancelled';
COMMENT ON COLUMN public.demo_bookings.assigned_to IS 'Admin user assigned to handle this demo booking';
COMMENT ON COLUMN public.demo_bookings.confirmed_at IS 'When the demo booking was confirmed by an admin';
COMMENT ON COLUMN public.demo_bookings.completed_at IS 'When the demo was completed';
