#!/bin/bash

# Marketing Tab Testing Script
# This script helps verify the Marketing tab implementation is working correctly

echo "🎨 Marketing Tab Testing Helper"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if files exist
echo "1. Verifying Files Exist..."
echo "----------------------------"

FILES=(
    "src/components/project/TabMarketing.astro"
    "src/components/project/FileManager.astro"
    "src/pages/project/[id].astro"
    "src/components/common/ProjectPortfolio.astro"
    "markdowns/marketing-tab-implementation.md"
    "sql-queriers/setup-marketing-tab.sql"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "$file"
    else
        print_status 1 "$file - MISSING!"
    fi
done

echo ""
echo "2. Checking for Featured Toggle Removal..."
echo "-------------------------------------------"
if grep -q "file-featured-" "src/components/project/FileManager.astro"; then
    print_status 1 "Featured toggle still present in FileManager.astro"
else
    print_status 0 "Featured toggle successfully removed from FileManager.astro"
fi

echo ""
echo "3. Verifying Marketing Tab Integration..."
echo "------------------------------------------"
if grep -q "TabMarketing" "src/pages/project/[id].astro"; then
    print_status 0 "TabMarketing imported in [id].astro"
else
    print_status 1 "TabMarketing NOT imported in [id].astro"
fi

if grep -q '"marketing"' "src/pages/project/[id].astro"; then
    print_status 0 "'marketing' added to validTabs"
else
    print_status 1 "'marketing' NOT in validTabs"
fi

if grep -q "status-marketing" "src/pages/project/[id].astro"; then
    print_status 0 "Marketing tab navigation item added"
else
    print_status 1 "Marketing tab navigation item NOT added"
fi

echo ""
echo "4. Checking ProjectPortfolio Updates..."
echo "----------------------------------------"
if grep -q "project-marketing" "src/components/common/ProjectPortfolio.astro"; then
    print_status 0 "ProjectPortfolio uses project-marketing bucket"
else
    print_status 1 "ProjectPortfolio NOT using project-marketing bucket"
fi

if grep -q "featuredImageUrl" "src/components/common/ProjectPortfolio.astro"; then
    print_status 0 "ProjectPortfolio uses featuredImageUrl"
else
    print_status 1 "ProjectPortfolio NOT using featuredImageUrl"
fi

echo ""
echo "5. Database Setup Checklist..."
echo "-------------------------------"
print_info "Run the following SQL script in Supabase SQL Editor:"
echo "    sql-queriers/setup-marketing-tab.sql"
echo ""
print_info "Verify in Supabase Dashboard > Storage:"
echo "    • Bucket 'project-marketing' exists"
echo "    • Bucket is set to PUBLIC"
echo "    • Bucket allows image MIME types"
echo ""

echo ""
echo "6. Manual Testing Steps..."
echo "--------------------------"
print_info "Step 1: Navigate to any project page"
echo "    → Click on 'Marketing' tab (Admin/Staff only)"
echo ""
print_info "Step 2: Upload Marketing Images"
echo "    → Upload 2-3 test images"
echo "    → Verify they appear in gallery grid"
echo "    → Check browser console for errors"
echo ""
print_info "Step 3: Set Featured Image"
echo "    → Click star icon on one image"
echo "    → Verify featured preview appears at top"
echo "    → Click 'Save Marketing Content' button"
echo "    → Verify success notification"
echo ""
print_info "Step 4: Verify Portfolio Display"
echo "    → Navigate to portfolio/projects page"
echo "    → Verify featured image displays (no 404)"
echo "    → Test category filters"
echo ""
print_info "Step 5: Test Edge Cases"
echo "    → Try uploading non-image file (should fail)"
echo "    → Delete a non-featured image"
echo "    → Delete the featured image (preview should clear)"
echo "    → Upload large image (test 10MB limit)"
echo ""

echo ""
echo "7. Troubleshooting Quick Checks..."
echo "-----------------------------------"
print_info "If images show 404 errors:"
echo "    • Check bucket name is 'project-marketing'"
echo "    • Verify bucket is PUBLIC in Supabase"
echo "    • Check RLS policies allow public read"
echo ""
print_info "If upload fails:"
echo "    • Check file size < 10MB"
echo "    • Verify only image types (jpeg, png, webp, gif)"
echo "    • Check bucket storage quota"
echo ""
print_info "If featured image doesn't update:"
echo "    • Check browser console for API errors"
echo "    • Verify featuredImageId column exists in projects table"
echo "    • Check file ID exists in files table"
echo ""

echo ""
echo "8. Test URLs to Check..."
echo "------------------------"
print_info "Once you have a project with featured image:"
echo "    Project Page: http://localhost:4321/project/[ID]?status=marketing"
echo "    Portfolio:    http://localhost:4321/portfolio"
echo ""

echo ""
echo "================================"
echo "✨ Testing checklist complete!"
echo ""
print_info "For detailed implementation notes, see:"
echo "    markdowns/marketing-tab-implementation.md"
echo ""
