#!/bin/bash

# =====================================================
# CLONE ENTIRE SUPABASE DATABASE SCHEMA
# Exports COMPLETE schema from source and imports to target
# Includes: tables, functions, triggers, RLS, indexes, views, sequences
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

SOURCE_URL="https://${SOURCE_PROJECT_REF}.supabase.co"
TARGET_URL="https://${TARGET_PROJECT_REF}.supabase.co"

echo -e "${GREEN}🔄 Clone Entire Database Schema${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Source:${NC} $SOURCE_URL ($SOURCE_PROJECT_REF)"
echo -e "${BLUE}Target:${NC} $TARGET_URL ($TARGET_PROJECT_REF)"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in${NC}"
    echo "Logging in..."
    supabase login
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
SCHEMA_FILE="$TEMP_DIR/complete-schema-$(date +%Y%m%d-%H%M%S).sql"

echo -e "${BLUE}📤 Step 1: Exporting complete schema from source...${NC}"
echo ""

# Method 1: Try Supabase CLI db dump
echo -e "${YELLOW}Attempting export via Supabase CLI...${NC}"

# Link to source project
echo -e "${YELLOW}Linking to source project...${NC}"
if supabase link --project-ref "$SOURCE_PROJECT_REF" 2>/dev/null; then
    echo -e "${GREEN}✅ Linked to source project${NC}"
    
    # Export schema
    echo -e "${YELLOW}Exporting schema (this may take a few minutes)...${NC}"
    if supabase db dump --schema public --schema-only --no-data > "$SCHEMA_FILE" 2>&1; then
        if [ -s "$SCHEMA_FILE" ]; then
            echo -e "${GREEN}✅ Schema exported successfully!${NC}"
            echo -e "${BLUE}Size:${NC} $(wc -l < "$SCHEMA_FILE") lines"
            EXPORT_SUCCESS=true
        else
            echo -e "${YELLOW}⚠️  Export file is empty, trying alternative...${NC}"
            EXPORT_SUCCESS=false
        fi
    else
        echo -e "${YELLOW}⚠️  CLI export failed, trying alternative...${NC}"
        EXPORT_SUCCESS=false
    fi
    
    # Unlink
    supabase unlink 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Could not auto-link to source project${NC}"
    EXPORT_SUCCESS=false
fi

# Method 2: Provide instructions for manual export
if [ "$EXPORT_SUCCESS" != "true" ]; then
    echo ""
    echo -e "${YELLOW}📋 Manual Export Required${NC}"
    echo "=================================="
    echo ""
    echo "Since automatic export didn't work, please export manually:"
    echo ""
    echo "Option A: Using Supabase Dashboard (Recommended)"
    echo "  1. Go to: https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF"
    echo "  2. Settings → Database → Connection string"
    echo "  3. Copy the Pooler connection string"
    echo "  4. Run: pg_dump \"[CONNECTION_STRING]\" --schema-only --no-owner --no-acl --schema=public > schema.sql"
    echo ""
    echo "Option B: Using SQL Editor"
    echo "  1. Go to: https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF"
    echo "  2. SQL Editor → New query"
    echo "  3. Run queries from: sql-queriers/export-complete-schema.sql"
    echo "  4. Copy all CREATE statements to a file"
    echo ""
    read -p "Press Enter after you've exported the schema to continue, or Ctrl+C to cancel..."
    
    # Ask for schema file location
    read -p "Enter path to exported schema file: " SCHEMA_FILE
    if [ ! -f "$SCHEMA_FILE" ]; then
        echo -e "${RED}❌ File not found: $SCHEMA_FILE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Found schema file${NC}"
fi

echo ""
echo -e "${BLUE}📥 Step 2: Importing schema to target...${NC}"
echo ""

# Link to target project
echo -e "${YELLOW}Linking to target project...${NC}"
if supabase link --project-ref "$TARGET_PROJECT_REF" 2>/dev/null; then
    echo -e "${GREEN}✅ Linked to target project${NC}"
    
    # Confirm
    echo ""
    echo -e "${RED}⚠️  WARNING: This will modify the target database!${NC}"
    echo -e "${YELLOW}The complete schema will be imported to: $TARGET_PROJECT_REF${NC}"
    echo ""
    read -p "Continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}Cancelled. Schema file saved at: $SCHEMA_FILE${NC}"
        supabase unlink 2>/dev/null || true
        exit 0
    fi
    
    # Import schema
    echo ""
    echo -e "${YELLOW}Importing schema (this may take several minutes)...${NC}"
    echo -e "${YELLOW}Note: Some 'already exists' errors are normal and can be ignored${NC}"
    echo ""
    
    if supabase db execute --file "$SCHEMA_FILE" 2>&1 | tee "${SCHEMA_FILE%.sql}-import.log"; then
        echo ""
        echo -e "${GREEN}✅ Schema import completed!${NC}"
        echo -e "${BLUE}Log file:${NC} ${SCHEMA_FILE%.sql}-import.log"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Import completed with some errors${NC}"
        echo -e "${BLUE}Review log:${NC} ${SCHEMA_FILE%.sql}-import.log"
        echo "Some errors (like 'already exists') are normal and can be ignored."
    fi
    
    # Unlink
    supabase unlink 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Could not auto-link to target project${NC}"
    echo ""
    echo "Please import manually:"
    echo "  1. Go to: https://supabase.com/dashboard/project/$TARGET_PROJECT_REF"
    echo "  2. SQL Editor → New query"
    echo "  3. Copy contents of: $SCHEMA_FILE"
    echo "  4. Paste and run"
fi

echo ""
echo -e "${GREEN}✅ Process complete!${NC}"
echo ""
echo "Schema file location: $SCHEMA_FILE"
echo ""
echo "Next steps:"
echo "  1. Verify schema in target project dashboard"
echo "  2. Check that all tables, functions, and policies exist"
echo "  3. Test your application"
