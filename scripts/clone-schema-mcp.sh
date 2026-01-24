#!/bin/bash

# =====================================================
# CLONE SCHEMA USING SUPABASE MCP/API
# Uses Supabase Management API (same as MCP server uses)
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SOURCE_PROJECT_REF="${1:-qudlxlryegnainztkrtk}"
TARGET_PROJECT_REF="${2:-fhqglhcjlkusrykqnoel}"

echo -e "${GREEN}🔄 Clone Schema via Supabase MCP/API${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Source:${NC} $SOURCE_PROJECT_REF"
echo -e "${BLUE}Target:${NC} $TARGET_PROJECT_REF"
echo ""

# Check for access token (from MCP config or env)
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}❌ SUPABASE_ACCESS_TOKEN not found${NC}"
    echo "Set it: export SUPABASE_ACCESS_TOKEN='your-token'"
    echo "Get your token from: https://supabase.com/dashboard/account/tokens"
    exit 1
fi

echo -e "${GREEN}✅ Access token found${NC}"
echo ""

# Use Node.js script for API calls
if command -v node &> /dev/null; then
    echo -e "${BLUE}Using Node.js API script...${NC}"
    node scripts/clone-schema-via-api.js "$SOURCE_PROJECT_REF" "$TARGET_PROJECT_REF"
else
    echo -e "${YELLOW}Node.js not found. Using alternative method...${NC}"
    echo ""
    echo "Since Supabase Management API doesn't support direct schema export,"
    echo "we'll use the SQL-based export method:"
    echo ""
    echo "1. Run the export SQL in source project:"
    echo "   https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF/sql"
    echo ""
    echo "2. Use the queries from: sql-queriers/export-complete-schema.sql"
    echo ""
    echo "3. Import results to target project:"
    echo "   https://supabase.com/dashboard/project/$TARGET_PROJECT_REF/sql"
fi
