-- CMS Pages Table
-- Stores page content (markdown) for each deployment/client
-- Allows per-deployment customization without git commits

CREATE TABLE IF NOT EXISTS cmsPages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT NOT NULL, -- markdown content
  frontmatter JSONB DEFAULT '{}', -- frontmatter fields as JSON
  template TEXT DEFAULT 'default', -- template name (default, fullwidth, minimal)
  client_id TEXT, -- optional: for multi-client deployments (use RAILWAY_PROJECT_NAME)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique slug per client (or globally if client_id is null)
  CONSTRAINT unique_slug_per_client UNIQUE (slug, client_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cmsPages_slug ON cmsPages(slug);
CREATE INDEX IF NOT EXISTS idx_cmsPages_client_id ON cmsPages(client_id);
CREATE INDEX IF NOT EXISTS idx_cmsPages_active ON cmsPages(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE cmsPages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active pages
CREATE POLICY "Anyone can read active CMS pages"
  ON cmsPages
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all pages (using service role key)
-- Note: This requires service role key, which bypasses RLS
-- For user-facing admin, create additional policies based on auth.users

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cmsPages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cmsPages_timestamp
  BEFORE UPDATE ON cmsPages
  FOR EACH ROW
  EXECUTE FUNCTION update_cmsPages_updated_at();

-- Insert default pages (optional - can be done via API)
-- These will be used if no database content exists
COMMENT ON TABLE cmsPages IS 'CMS pages table for storing markdown content per deployment/client';
COMMENT ON COLUMN cmsPages.client_id IS 'Optional client identifier (e.g., RAILWAY_PROJECT_NAME) for multi-client deployments';
COMMENT ON COLUMN cmsPages.frontmatter IS 'Frontmatter fields stored as JSON (title, description, hero, etc.)';

