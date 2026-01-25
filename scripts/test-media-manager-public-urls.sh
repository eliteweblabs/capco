#!/bin/bash

# Test script for Media Manager Public URLs
# This script verifies that the media manager is using public URLs correctly

echo "🧪 Testing Media Manager Public URLs"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if code is using getPublicUrl instead of createSignedUrl
echo "Test 1: Checking for getPublicUrl usage..."
if grep -r "getPublicUrl" src/pages/api/files/get.ts > /dev/null && \
   grep -r "getPublicUrl" src/lib/media.ts > /dev/null && \
   grep -r "getPublicUrl" src/components/admin/AdminMedia.astro > /dev/null; then
    echo -e "${GREEN}✓ Code is using getPublicUrl${NC}"
else
    echo -e "${RED}✗ Code is not using getPublicUrl${NC}"
fi

# Test 2: Check that createSignedUrl is not being used for project-media
echo ""
echo "Test 2: Checking for createSignedUrl removal..."
if grep -r "project-media.*createSignedUrl" src/ > /dev/null 2>&1; then
    echo -e "${RED}✗ Found createSignedUrl still being used with project-media${NC}"
    grep -rn "project-media.*createSignedUrl" src/
else
    echo -e "${GREEN}✓ No createSignedUrl found with project-media${NC}"
fi

# Test 3: Check that publicUrl is being used instead of signedUrl
echo ""
echo "Test 3: Checking for publicUrl usage..."
if grep -r "urlData?.publicUrl" src/pages/api/files/get.ts > /dev/null && \
   grep -r "urlData?.publicUrl" src/lib/media.ts > /dev/null; then
    echo -e "${GREEN}✓ Code is using publicUrl${NC}"
else
    echo -e "${RED}✗ Code is not using publicUrl${NC}"
fi

# Test 4: Check if documentation exists
echo ""
echo "Test 4: Checking for documentation..."
if [ -f "markdowns/media-manager-public-urls.md" ]; then
    echo -e "${GREEN}✓ Documentation exists${NC}"
else
    echo -e "${RED}✗ Documentation not found${NC}"
fi

# Test 5: Check if SQL script exists
echo ""
echo "Test 5: Checking for SQL setup script..."
if [ -f "sql-queriers/setup-public-bucket-access.sql" ]; then
    echo -e "${GREEN}✓ SQL setup script exists${NC}"
else
    echo -e "${RED}✗ SQL setup script not found${NC}"
fi

echo ""
echo "===================================="
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Run the SQL script: sql-queriers/setup-public-bucket-access.sql"
echo "2. Test the media manager in the browser"
echo "3. Upload a file and copy its link"
echo "4. Verify the link works without authentication"
echo "5. Verify the link shows the full-size image"
echo ""
