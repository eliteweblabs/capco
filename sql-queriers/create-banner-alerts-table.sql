-- Banner Alerts Table
-- Stores site-wide banner alerts with position and expiration settings

-- Create the banner_alerts table
CREATE TABLE IF NOT EXISTS banner_alerts (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  position VARCHAR(10) DEFAULT 'top' CHECK (position IN ('top', 'bottom')),
  expireMs INTEGER, -- Milliseconds before auto-dismiss, NULL = never expires
  dismissible BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true,
  startDate TIMESTAMPTZ, -- When the banner should start showing (NULL = immediately)
  endDate TIMESTAMPTZ, -- When the banner should stop showing (NULL = never)
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updatedAt TIMESTAMPTZ DEFAULT NOW(),
  createdBy UUID REFERENCES auth.users(id)
);

-- Create index for active banners query
CREATE INDEX IF NOT EXISTS idx_banner_alerts_active ON banner_alerts (isActive, startDate, endDate);

-- Enable RLS
ALTER TABLE banner_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active banners
CREATE POLICY "Anyone can read active banners" ON banner_alerts
  FOR SELECT USING (isActive = true);

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage banner alerts" ON banner_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_banner_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER banner_alerts_updated_at
  BEFORE UPDATE ON banner_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_alerts_updated_at();

-- Grant permissions
GRANT SELECT ON banner_alerts TO authenticated;
GRANT ALL ON banner_alerts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE banner_alerts_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE banner_alerts_id_seq TO service_role;
