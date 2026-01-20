#!/bin/bash

# ============================================
# CMS Pages Recovery (with camelCase)
# ============================================

set -e

echo "🔄 CMS Pages Recovery (camelCase preserved)"
echo "============================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Count markdown files
MARKDOWN_COUNT=$(ls -1 markdowns/*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found $MARKDOWN_COUNT markdown files ready to import${NC}"
echo ""

# Show SQL to run
echo -e "${YELLOW}STEP 1: Create the table in Supabase${NC}"
echo -e "${RED}⚠️  IMPORTANT: Table name must be quoted to preserve camelCase!${NC}"
echo ""
echo "Go to: ${BLUE}https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql${NC}"
echo ""
echo "Copy and run this SQL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'SQL'
-- Clean slate
DROP TABLE IF EXISTS cmsPages CASCADE;
DROP TABLE IF EXISTS cmspages CASCADE;
DROP TABLE IF EXISTS "cmsPages" CASCADE;

-- Create "cmsPages" (quoted to preserve case!)
CREATE TABLE "cmsPages" (
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

CREATE INDEX "idx_cmsPages_slug" ON "cmsPages"(slug);
CREATE INDEX "idx_cmsPages_client_id" ON "cmsPages"(client_id);
CREATE INDEX "idx_cmsPages_active" ON "cmsPages"(is_active) WHERE is_active = true;
CREATE INDEX "idx_cmsPages_display_order" ON "cmsPages"(display_order);

ALTER TABLE "cmsPages" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active CMS pages" ON "cmsPages" FOR SELECT USING (is_active = true);

CREATE OR REPLACE FUNCTION "update_cmsPages_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "update_cmsPages_timestamp"
  BEFORE UPDATE ON "cmsPages"
  FOR EACH ROW
  EXECUTE FUNCTION "update_cmsPages_updated_at"();

SELECT '✅ Table "cmsPages" created!' as status;
SQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}Press ENTER after running the SQL above...${NC}"
read

# Start dev server
echo ""
echo -e "${YELLOW}STEP 2: Import markdown files${NC}"
echo ""
echo "Starting dev server..."
echo ""
echo -e "${GREEN}Once server starts:${NC}"
echo "  1. Go to: ${BLUE}http://localhost:4321/admin/cms${NC}"
echo "  2. Click ${GREEN}'Import All Markdown'${NC} button"
echo "  3. Wait for all $MARKDOWN_COUNT files to import"
echo "  4. Press ${RED}Ctrl+C${NC} when done"
echo ""

npm run dev
