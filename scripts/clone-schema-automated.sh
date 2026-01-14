#!/bin/bash

# =====================================================
# AUTOMATED SCHEMA CLONE USING SUPABASE CLI
# Uses terminal commands (CLI) to automate the process
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

echo -e "${GREEN}🔄 Automated Schema Clone (CLI)${NC}"
echo "======================================"
echo ""
echo -e "${BLUE}Source:${NC} $SOURCE_PROJECT_REF"
echo -e "${BLUE}Target:${NC} $TARGET_PROJECT_REF"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install: npm install -g supabase"
    exit 1
fi

# Login check
echo -e "${YELLOW}Checking authentication...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}Not logged in. Please login:${NC}"
    echo "Run: supabase login"
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Authenticated${NC}"
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
SCHEMA_FILE="$TEMP_DIR/schema-export-$(date +%Y%m%d-%H%M%S).sql"

echo -e "${BLUE}📤 Step 1: Exporting schema from source...${NC}"

# Link to source
echo -e "${YELLOW}Linking to source project: $SOURCE_PROJECT_REF${NC}"
if supabase link --project-ref "$SOURCE_PROJECT_REF" 2>&1 | tee "$TEMP_DIR/link-source.log"; then
    echo -e "${GREEN}✅ Linked to source${NC}"
    
    # Export schema
    echo -e "${YELLOW}Exporting complete schema...${NC}"
    if supabase db dump --schema public --schema-only --no-data > "$SCHEMA_FILE" 2>&1; then
        if [ -s "$SCHEMA_FILE" ]; then
            LINE_COUNT=$(wc -l < "$SCHEMA_FILE")
            echo -e "${GREEN}✅ Schema exported: $LINE_COUNT lines${NC}"
            EXPORT_SUCCESS=true
        else
            echo -e "${YELLOW}⚠️  Export file is empty${NC}"
            EXPORT_SUCCESS=false
        fi
    else
        echo -e "${YELLOW}⚠️  Export failed, check log${NC}"
        EXPORT_SUCCESS=false
    fi
    
    # Unlink
    supabase unlink 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Could not link to source project${NC}"
    echo "You may need to link manually:"
    echo "  supabase link --project-ref $SOURCE_PROJECT_REF"
    EXPORT_SUCCESS=false
fi

if [ "$EXPORT_SUCCESS" != "true" ]; then
    echo ""
    echo -e "${RED}❌ Automatic export failed${NC}"
    echo ""
    echo "Please export manually using one of these methods:"
    echo ""
    echo "Method 1: SQL Editor"
    echo "  1. Go to: https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF/sql"
    echo "  2. Run queries from: sql-queriers/export-complete-schema.sql"
    echo "  3. Copy CREATE statements to: $SCHEMA_FILE"
    echo ""
    echo "Method 2: pg_dump (if PostgreSQL tools installed)"
    echo "  Get connection string from Supabase dashboard"
    echo "  Run: pg_dump [CONN_STRING] --schema-only --no-owner --no-acl --schema=public > $SCHEMA_FILE"
    echo ""
    read -p "Press Enter after exporting schema, or Ctrl+C to cancel..."
    
    if [ ! -f "$SCHEMA_FILE" ] || [ ! -s "$SCHEMA_FILE" ]; then
        read -p "Enter path to exported schema file: " SCHEMA_FILE
        if [ ! -f "$SCHEMA_FILE" ]; then
            echo -e "${RED}❌ File not found${NC}"
            exit 1
        fi
    fi
fi

echo ""
echo -e "${BLUE}📥 Step 2: Importing schema to target...${NC}"

# Link to target
echo -e "${YELLOW}Linking to target project: $TARGET_PROJECT_REF${NC}"
if supabase link --project-ref "$TARGET_PROJECT_REF" 2>&1 | tee "$TEMP_DIR/link-target.log"; then
    echo -e "${GREEN}✅ Linked to target${NC}"
    
    # Confirm
    echo ""
    echo -e "${RED}⚠️  WARNING: This will modify the target database!${NC}"
    echo -e "${YELLOW}Target: $TARGET_PROJECT_REF${NC}"
    read -p "Continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}Cancelled. Schema file: $SCHEMA_FILE${NC}"
        supabase unlink 2>/dev/null || true
        exit 0
    fi
    
    # Import
    echo ""
    echo -e "${YELLOW}Importing schema (this may take several minutes)...${NC}"
    echo -e "${YELLOW}Note: Some 'already exists' errors are normal${NC}"
    echo ""
    
    IMPORT_LOG="$TEMP_DIR/import-$(date +%Y%m%d-%H%M%S).log"
    if supabase db execute --file "$SCHEMA_FILE" 2>&1 | tee "$IMPORT_LOG"; then
        echo ""
        echo -e "${GREEN}✅ Import completed!${NC}"
        echo -e "${BLUE}Log:${NC} $IMPORT_LOG"
    else
        echo ""
        echo -e "${YELLOW}⚠️  Import completed with some errors${NC}"
        echo -e "${BLUE}Review log:${NC} $IMPORT_LOG"
        echo "Some errors (like 'already exists') are normal."
    fi
    
    # Unlink
    supabase unlink 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Could not link to target project${NC}"
    echo ""
    echo "Please import manually:"
    echo "  1. Go to: https://supabase.com/dashboard/project/$TARGET_PROJECT_REF/sql"
    echo "  2. Copy contents of: $SCHEMA_FILE"
    echo "  3. Paste and run in SQL Editor"
fi

echo ""
echo -e "${GREEN}✅ Process complete!${NC}"
echo ""
echo -e "${BLUE}Schema file:${NC} $SCHEMA_FILE"
echo -e "${BLUE}Logs directory:${NC} $TEMP_DIR"
echo ""
echo "Next steps:"
echo "  1. Verify schema in target project dashboard"
echo "  2. Check that all tables, functions, and policies exist"
echo "  3. Test your application"
