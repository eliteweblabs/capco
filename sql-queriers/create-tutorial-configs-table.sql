-- Create tutorial_configs table for storing user tutorial progress
CREATE TABLE IF NOT EXISTS tutorial_configs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  last_step INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per user per tutorial
  UNIQUE(user_id, tutorial_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutorial_configs_user_id ON tutorial_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_configs_tutorial_id ON tutorial_configs(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_configs_completed ON tutorial_configs(completed);
CREATE INDEX IF NOT EXISTS idx_tutorial_configs_dismissed ON tutorial_configs(dismissed);

-- Enable Row Level Security
ALTER TABLE tutorial_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own tutorial configs
CREATE POLICY "Users can view their own tutorial configs" ON tutorial_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial configs" ON tutorial_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial configs" ON tutorial_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutorial configs" ON tutorial_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can access all tutorial configs
CREATE POLICY "Admins can view all tutorial configs" ON tutorial_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Admins can update all tutorial configs" ON tutorial_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

CREATE POLICY "Admins can delete all tutorial configs" ON tutorial_configs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'Admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutorial_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tutorial_configs_updated_at
  BEFORE UPDATE ON tutorial_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_configs_updated_at();

-- Add comments for documentation
COMMENT ON TABLE tutorial_configs IS 'Stores user tutorial progress and preferences';
COMMENT ON COLUMN tutorial_configs.user_id IS 'Reference to the user who owns this tutorial config';
COMMENT ON COLUMN tutorial_configs.tutorial_id IS 'Identifier for the specific tutorial (e.g., "onboarding", "dashboard")';
COMMENT ON COLUMN tutorial_configs.completed IS 'Whether the user has completed this tutorial';
COMMENT ON COLUMN tutorial_configs.dismissed IS 'Whether the user has dismissed this tutorial';
COMMENT ON COLUMN tutorial_configs.last_step IS 'The last step the user reached in the tutorial';
