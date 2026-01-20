-- ============================================
-- CMS Pages Table Recreation
-- ============================================
-- Run this in Supabase SQL Editor to recreate the cmsPages table
-- URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- STEP 1: Clean up any existing tables with wrong names
-- ============================================
DROP TABLE IF EXISTS cmsPages CASCADE;
DROP TABLE IF EXISTS cmspages CASCADE;
DROP TABLE IF EXISTS "cmsPages" CASCADE;

-- STEP 2: Recreate with correct snake_case name
-- ============================================
CREATE TABLE cmsPages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT NOT NULL,
  frontmatter JSONB DEFAULT '{}',
  template TEXT DEFAULT 'default',
  client_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  include_in_navigation BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  nav_roles TEXT[] DEFAULT ARRAY['any'::TEXT],
  nav_page_type TEXT DEFAULT 'frontend',
  nav_button_style TEXT,
  nav_desktop_only BOOLEAN DEFAULT false,
  nav_hide_when_auth BOOLEAN DEFAULT false,
  
  -- Ensure unique slug per client
  CONSTRAINT unique_slug_per_client UNIQUE (slug, client_id)
);

-- STEP 3: Create indexes for performance
-- ============================================
CREATE INDEX idx_cmsPages_slug ON cmsPages(slug);
CREATE INDEX idx_cmsPages_client_id ON cmsPages(client_id);
CREATE INDEX idx_cmsPages_active ON cmsPages(is_active) WHERE is_active = true;
CREATE INDEX idx_cmsPages_display_order ON cmsPages(display_order);
CREATE INDEX idx_cmsPages_navigation ON cmsPages(include_in_navigation) WHERE include_in_navigation = true;

-- STEP 4: Enable Row Level Security
-- ============================================
ALTER TABLE cmsPages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active pages
CREATE POLICY "Anyone can read active CMS pages"
  ON cmsPages
  FOR SELECT
  USING (is_active = true);

-- Policy: Service role can do everything (for admin operations)
-- Note: This is enforced via service role key, not a policy

-- STEP 5: Create auto-update trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_cmsPages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cmsPages_timestamp
  BEFORE UPDATE ON cmsPages
  FOR EACH ROW
  EXECUTE FUNCTION update_cmsPages_updated_at();

-- STEP 6: Add helpful comments
-- ============================================
COMMENT ON TABLE cmsPages IS 'CMS pages table for storing markdown content per deployment/client';
COMMENT ON COLUMN cmsPages.slug IS 'URL slug for the page (e.g., "about" for /about)';
COMMENT ON COLUMN cmsPages.client_id IS 'Optional client identifier (e.g., RAILWAY_PROJECT_NAME) for multi-client deployments';
COMMENT ON COLUMN cmsPages.frontmatter IS 'Frontmatter fields stored as JSON (title, description, hero, etc.)';
COMMENT ON COLUMN cmsPages.include_in_navigation IS 'If true, this page will appear in the primary navigation menu';
COMMENT ON COLUMN cmsPages.display_order IS 'Display order for navigation (lower numbers appear first)';
COMMENT ON COLUMN cmsPages.nav_roles IS 'Array of user roles that can see this page in navigation: any, Client, Admin, Staff';
COMMENT ON COLUMN cmsPages.nav_page_type IS 'Page type: frontend or backend';

-- STEP 7: Verify creation
-- ============================================
SELECT 
  '✅ Table cmsPages created successfully!' as status,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'cmsPages';

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cmsPages'
ORDER BY ordinal_position;

-- ============================================
-- NEXT STEPS
-- ============================================
-- 1. ✅ Table created
-- 2. Update your code: cmsPages → cmsPages
-- 3. Re-import markdown files via:
--    - Admin UI: http://localhost:4321/admin/cms (click "Import All Markdown")
--    - OR API: POST http://localhost:4321/api/cms/import-all-markdown
-- 4. Verify pages appear in navigation
-- ============================================
