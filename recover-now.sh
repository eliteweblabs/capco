#!/bin/bash

# Quick CMS Recovery - Run this now!
# ===================================

echo "🚀 CMS Pages Quick Recovery"
echo "============================"
echo ""

# Step 1: Show SQL to copy
echo "📋 STEP 1: Copy this SQL and run it in Supabase SQL Editor"
echo "URL: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql"
echo ""
echo "----------------------------------------"
cat << 'SQLEND'
-- Clean slate
DROP TABLE IF EXISTS cmsPages CASCADE;
DROP TABLE IF EXISTS cmspages CASCADE;
DROP TABLE IF EXISTS "cmsPages" CASCADE;

-- Create cmsPages table
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
  CONSTRAINT unique_slug_per_client UNIQUE (slug, client_id)
);

CREATE INDEX idx_cmsPages_slug ON cmsPages(slug);
CREATE INDEX idx_cmsPages_client_id ON cmsPages(client_id);
CREATE INDEX idx_cmsPages_active ON cmsPages(is_active) WHERE is_active = true;
CREATE INDEX idx_cmsPages_display_order ON cmsPages(display_order);

ALTER TABLE cmsPages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active CMS pages" ON cmsPages FOR SELECT USING (is_active = true);

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

SELECT '✅ Table created!' as status, COUNT(*) as columns 
FROM information_schema.columns WHERE table_name = 'cmsPages';
SQLEND
echo "----------------------------------------"
echo ""
read -p "Press ENTER after you've run the SQL above..."

# Step 2: Start dev server and import
echo ""
echo "📦 STEP 2: Starting dev server for import..."
echo ""
echo "Once the server starts:"
echo "  1. Go to: http://localhost:4321/admin/cms"
echo "  2. Click 'Import All Markdown' button"
echo "  3. Wait for all 125 files to import"
echo ""
echo "Press Ctrl+C when done."
echo ""

npm run dev
