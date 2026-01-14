#!/bin/bash

# =====================================================
# IMPORT SUPABASE SCHEMA
# Imports a schema SQL file to a Supabase project
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SCHEMA_FILE="${1:-supabase-schema-export.sql}"
TARGET_PROJECT_REF="${2:-fhqglhcjlkusrykqnoel}"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}📥 Importing Supabase Schema${NC}"
echo "=================================="
echo -e "${BLUE}File:${NC} $SCHEMA_FILE"
echo -e "${BLUE}Target:${NC} $TARGET_PROJECT_REF"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    exit 1
fi

# Link to target project
echo -e "${YELLOW}Linking to target project...${NC}"
supabase link --project-ref "$TARGET_PROJECT_REF" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Project may already be linked or needs manual linking${NC}"
}

# Confirm
echo -e "${RED}⚠️  WARNING: This will modify the target database!${NC}"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

# Import schema
echo -e "${YELLOW}Importing schema...${NC}"
supabase db execute --file "$SCHEMA_FILE" 2>&1

echo ""
echo -e "${GREEN}✅ Import complete!${NC}"
echo "Review any errors above and verify in Supabase dashboard"
