-- Create globalSettings table for storing company branding and global settings
-- This table stores settings like company name, colors, logos, icons, etc.

CREATE TABLE IF NOT EXISTS globalSettings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  value_type TEXT NOT NULL DEFAULT 'text',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_globalSettings_key ON globalSettings(key);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_globalSettings_category ON globalSettings(category);

-- Add comment to table
COMMENT ON TABLE globalSettings IS 'Stores global company settings like branding, colors, logos, and company information';
