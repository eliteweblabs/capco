-- CMS Pages Table
-- Stores page content (markdown) for each deployment/client
-- Allows per-deployment customization without git commits

CREATE TABLE IF NOT EXISTS cms_pages (
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
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_client_id ON cms_pages(client_id);
CREATE INDEX IF NOT EXISTS idx_cms_pages_active ON cms_pages(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active pages
CREATE POLICY "Anyone can read active CMS pages"
  ON cms_pages
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can manage all pages (using service role key)
-- Note: This requires service role key, which bypasses RLS
-- For user-facing admin, create additional policies based on auth.users

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cms_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cms_pages_timestamp
  BEFORE UPDATE ON cms_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_cms_pages_updated_at();

-- Insert default pages (optional - can be done via API)
-- These will be used if no database content exists
COMMENT ON TABLE cms_pages IS 'CMS pages table for storing markdown content per deployment/client';
COMMENT ON COLUMN cms_pages.client_id IS 'Optional client identifier (e.g., RAILWAY_PROJECT_NAME) for multi-client deployments';
COMMENT ON COLUMN cms_pages.frontmatter IS 'Frontmatter fields stored as JSON (title, description, hero, etc.)';

