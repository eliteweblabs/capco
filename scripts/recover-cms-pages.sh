#!/bin/bash

# ============================================
# CMS Pages Recovery Script
# ============================================
# This script will:
# 1. Revert cmsPages → cmsPages in code
# 2. Recreate the table in Supabase
# 3. Re-import all markdown files

set -e  # Exit on error

echo "🔄 CMS Pages Recovery Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Count markdown files
echo -e "${YELLOW}Step 1: Checking markdown files...${NC}"
MARKDOWN_COUNT=$(ls -1 markdowns/*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found $MARKDOWN_COUNT markdown files${NC}"
echo ""

# Step 2: Backup current code (just in case)
echo -e "${YELLOW}Step 2: Creating code backup...${NC}"
BACKUP_DIR="backups/code_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Code backed up to $BACKUP_DIR${NC}"
echo ""

# Step 3: Revert cmsPages to cmsPages in code
echo -e "${YELLOW}Step 3: Reverting table name in code...${NC}"
echo "Finding files with 'cmsPages' references..."

# Find and replace in TypeScript/JavaScript files
find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.astro" \) -exec sed -i.bak 's/"cmsPages"/"cmsPages"/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.js" -o -name "*.astro" \) -exec sed -i.bak "s/'cmsPages'/'cmsPages'/g" {} \;

# Remove backup files
find src -type f -name "*.bak" -delete

echo -e "${GREEN}✓ Code updated (cmsPages → cmsPages)${NC}"
echo ""

# Step 4: Show SQL to run in Supabase
echo -e "${YELLOW}Step 4: Database table recreation${NC}"
echo -e "${RED}⚠️  MANUAL STEP REQUIRED${NC}"
echo ""
echo "Please run this SQL in your Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql"
echo ""
echo -e "${YELLOW}================================================${NC}"
cat << 'SQL'
-- Drop and recreate cmsPages table
DROP TABLE IF EXISTS cmsPages CASCADE;
DROP TABLE IF EXISTS cmspages CASCADE;
DROP TABLE IF EXISTS "cmsPages" CASCADE;

-- Recreate with proper name
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
  displayOrder INTEGER DEFAULT 0,
  nav_roles TEXT[] DEFAULT ARRAY['any'::TEXT],
  nav_page_type TEXT DEFAULT 'frontend',
  nav_button_style TEXT,
  nav_desktop_only BOOLEAN DEFAULT false,
  nav_hide_when_auth BOOLEAN DEFAULT false,
  
  CONSTRAINT unique_slug_per_client UNIQUE (slug, client_id)
);

-- Indexes
CREATE INDEX idx_cmsPages_slug ON cmsPages(slug);
CREATE INDEX idx_cmsPages_client_id ON cmsPages(client_id);
CREATE INDEX idx_cmsPages_active ON cmsPages(is_active) WHERE is_active = true;
CREATE INDEX idx_cmsPages_displayOrder ON cmsPages(displayOrder);

-- RLS
ALTER TABLE cmsPages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active CMS pages"
  ON cmsPages FOR SELECT
  USING (is_active = true);

-- Triggers
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

-- Verify
SELECT 'Table cmsPages created!' as status;
SQL
echo -e "${YELLOW}================================================${NC}"
echo ""
echo "After running the SQL above, press Enter to continue..."
read

# Step 5: Start dev server and re-import
echo -e "${YELLOW}Step 5: Re-importing markdown files...${NC}"
echo ""
echo "Choose import method:"
echo "  1) Start dev server and use Admin UI (recommended)"
echo "  2) Use API directly (requires running server)"
echo ""
read -p "Enter choice (1 or 2): " CHOICE

if [ "$CHOICE" = "1" ]; then
  echo ""
  echo -e "${GREEN}Starting dev server...${NC}"
  echo "Once server is running:"
  echo "  1. Go to http://localhost:4321/admin/cms"
  echo "  2. Click 'Import All Markdown' button"
  echo "  3. Wait for import to complete"
  echo ""
  echo "Press Ctrl+C to stop the server when done."
  npm run dev
  
elif [ "$CHOICE" = "2" ]; then
  echo ""
  echo "Calling import API..."
  curl -X POST http://localhost:4321/api/cms/import-all-markdown
  echo ""
  echo -e "${GREEN}✓ Import request sent${NC}"
fi

echo ""
echo -e "${GREEN}=============================="
echo "Recovery Complete! ✅"
echo "==============================${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify pages in admin: http://localhost:4321/admin/cms"
echo "  2. Check that navigation items appear"
echo "  3. Test a few pages to ensure content is correct"
echo ""
echo "Consider upgrading to Supabase Pro for automatic backups!"
