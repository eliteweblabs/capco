#!/bin/bash

# =====================================================
# CLONE SUPABASE SCHEMA BETWEEN PROJECTS
# Exports schema (tables, functions, triggers, RLS, etc.)
# from source project and imports to target project
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Source and target project refs (extracted from URLs)
SOURCE_PROJECT_REF="qudlxlryegnainztkrtk"
TARGET_PROJECT_REF="fhqglhcjlkusrykqnoel"

SOURCE_URL="https://qudlxlryegnainztkrtk.supabase.co"
TARGET_URL="https://fhqglhcjlkusrykqnoel.supabase.co"

echo -e "${GREEN}🔄 Supabase Schema Clone Tool${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}Source:${NC} $SOURCE_URL"
echo -e "${BLUE}Target:${NC} $TARGET_URL"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase CLI${NC}"
    echo "Please login with: supabase login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Supabase${NC}"
echo ""

# Create temp directory for exports
TEMP_DIR=$(mktemp -d)
SCHEMA_FILE="$TEMP_DIR/schema.sql"
FUNCTIONS_FILE="$TEMP_DIR/functions.sql"
POLICIES_FILE="$TEMP_DIR/policies.sql"

echo -e "${BLUE}📤 Step 1: Exporting schema from source project...${NC}"

# Export schema using Supabase CLI
# Note: We'll need to link to the source project first
echo -e "${YELLOW}Linking to source project...${NC}"
supabase link --project-ref "$SOURCE_PROJECT_REF" --password "$SOURCE_PROJECT_REF" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not auto-link. You may need to link manually.${NC}"
    echo "Run: supabase link --project-ref $SOURCE_PROJECT_REF"
    echo "Then run this script again."
    exit 1
}

echo -e "${GREEN}✅ Linked to source project${NC}"

# Export database schema (structure only, no data)
echo -e "${YELLOW}Exporting schema...${NC}"
supabase db dump --schema public --data-only=false --schema-only=true > "$SCHEMA_FILE" 2>&1 || {
    echo -e "${RED}❌ Failed to export schema${NC}"
    echo "Trying alternative method..."
    
    # Alternative: Use pg_dump if available
    if command -v pg_dump &> /dev/null; then
        echo -e "${YELLOW}Trying pg_dump method...${NC}"
        # Get connection string from Supabase dashboard
        echo -e "${YELLOW}You'll need to get the connection string from:${NC}"
        echo "  $SOURCE_URL -> Settings -> Database -> Connection string"
        echo ""
        read -p "Enter connection string (or press Enter to skip): " CONN_STRING
        
        if [ -n "$CONN_STRING" ]; then
            pg_dump "$CONN_STRING" --schema-only --no-owner --no-acl > "$SCHEMA_FILE" 2>&1 || {
                echo -e "${RED}❌ pg_dump also failed${NC}"
                exit 1
            }
        else
            echo -e "${RED}❌ Cannot proceed without connection string${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Both methods failed. Please export manually from Supabase dashboard.${NC}"
        exit 1
    fi
}

if [ ! -s "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file is empty${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Schema exported (${BLUE}$(wc -l < "$SCHEMA_FILE")${GREEN} lines)${NC}"
echo ""

# Unlink from source
supabase unlink 2>/dev/null || true

echo -e "${BLUE}📥 Step 2: Importing schema to target project...${NC}"

# Link to target project
echo -e "${YELLOW}Linking to target project...${NC}"
supabase link --project-ref "$TARGET_PROJECT_REF" --password "$TARGET_PROJECT_REF" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not auto-link. You may need to link manually.${NC}"
    echo "Run: supabase link --project-ref $TARGET_PROJECT_REF"
    echo "Then import manually:"
    echo "  supabase db execute --file $SCHEMA_FILE"
    exit 1
}

echo -e "${GREEN}✅ Linked to target project${NC}"

# Import schema
echo -e "${YELLOW}Importing schema...${NC}"
echo -e "${RED}⚠️  WARNING: This will modify the target database!${NC}"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Cancelled. Schema file saved at: $SCHEMA_FILE${NC}"
    exit 0
fi

supabase db execute --file "$SCHEMA_FILE" 2>&1 || {
    echo -e "${YELLOW}⚠️  Some errors occurred during import (this may be normal)${NC}"
    echo "Review the output above for critical errors"
}

echo ""
echo -e "${GREEN}✅ Schema import completed!${NC}"
echo ""

# Cleanup
echo -e "${BLUE}🧹 Cleaning up...${NC}"
# Keep the schema file for reference
echo -e "${GREEN}Schema file saved at: $SCHEMA_FILE${NC}"
echo "You can review it or use it for manual import if needed"

# Unlink from target
supabase unlink 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify the schema in target project dashboard"
echo "  2. Test your application"
echo "  3. Review any errors from the import process"
