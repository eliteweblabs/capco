#!/bin/bash

# Featured Image URL Encoding Fix - Migration Script
# This script applies the SQL migration to fix URL encoding issues with featured images

set -e  # Exit on any error

echo "================================================"
echo "Featured Image URL Encoding Fix - Migration"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    echo ""
    echo "Alternative: Copy the SQL file content and run it manually in Supabase Dashboard"
    echo "File: sql-queriers/fix-featured-image-url-encoding.sql"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking for files with URL issues...${NC}"
echo ""

# Run diagnostic query first
supabase db execute < sql-queriers/check-files-with-url-issues.sql

echo ""
echo -e "${YELLOW}Step 2: Review the results above${NC}"
echo "Press Enter to continue with the migration, or Ctrl+C to cancel"
read -r

echo ""
echo -e "${YELLOW}Step 3: Applying SQL migration...${NC}"
echo "This will:"
echo "  1. Update the sync_featured_image_data() function"
echo "  2. Recreate triggers"
echo "  3. Backfill all existing projects with corrected URLs"
echo ""

# Apply the migration
if supabase db execute < sql-queriers/fix-featured-image-url-encoding.sql; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Step 4: Verifying the fix...${NC}"
    echo ""
    
    # Run diagnostic query again to verify
    supabase db execute < sql-queriers/check-files-with-url-issues.sql
    
    echo ""
    echo -e "${GREEN}✅ All done!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test featured images on your frontend"
    echo "  2. Upload a file with spaces in the name"
    echo "  3. Set it as a featured image and verify it displays correctly"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    echo "Please check the error messages above"
    echo ""
    echo "You can try running the SQL manually:"
    echo "  supabase db execute < sql-queriers/fix-featured-image-url-encoding.sql"
    echo ""
    echo "Or copy the content from sql-queriers/fix-featured-image-url-encoding.sql"
    echo "and paste it into Supabase Dashboard SQL Editor"
    exit 1
fi
