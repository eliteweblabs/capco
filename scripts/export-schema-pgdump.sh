#!/bin/bash

# =====================================================
# EXPORT SUPABASE SCHEMA USING pg_dump
# More reliable than Supabase CLI for remote projects
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SOURCE_PROJECT_REF="${1:-qudlxlryegnainztkrtk}"
OUTPUT_FILE="${2:-schema-export-$(date +%Y%m%d-%H%M%S).sql}"

echo -e "${GREEN}📤 Exporting Supabase Schema (pg_dump)${NC}"
echo "=================================="
echo -e "${BLUE}Source Project:${NC} $SOURCE_PROJECT_REF"
echo -e "${BLUE}Output File:${NC} $OUTPUT_FILE"
echo ""

# Find pg_dump (check multiple locations)
PG_DUMP=""
if command -v pg_dump &> /dev/null; then
    PG_DUMP="pg_dump"
elif [ -f "/opt/homebrew/opt/postgresql@15/bin/pg_dump" ]; then
    PG_DUMP="/opt/homebrew/opt/postgresql@15/bin/pg_dump"
elif [ -f "/usr/local/opt/postgresql@15/bin/pg_dump" ]; then
    PG_DUMP="/usr/local/opt/postgresql@15/bin/pg_dump"
elif [ -f "$(brew --prefix postgresql@15)/bin/pg_dump" ]; then
    PG_DUMP="$(brew --prefix postgresql@15)/bin/pg_dump"
else
    echo -e "${RED}❌ pg_dump not found${NC}"
    echo "PostgreSQL is installed but pg_dump not in PATH."
    echo "Try:"
    echo "  export PATH=\"\$(brew --prefix postgresql@15)/bin:\$PATH\""
    echo "  $0 $SOURCE_PROJECT_REF $OUTPUT_FILE"
    exit 1
fi

echo -e "${GREEN}✅ pg_dump found: $PG_DUMP${NC}"
echo ""

# Get connection details
echo -e "${YELLOW}📋 Connection Details Needed:${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF"
echo "2. Settings → Database → Connection string"
echo "3. Click 'Reveal' next to Pooler connection string"
echo "4. Copy the connection string"
echo ""

read -p "Paste connection string (or press Enter to skip): " CONN_STRING

if [ -z "$CONN_STRING" ]; then
    echo -e "${YELLOW}⚠️  No connection string provided${NC}"
    echo ""
    echo "You can also set it as an environment variable:"
    echo "  export SUPABASE_CONN_STRING='postgresql://...'"
    echo "  $0 $SOURCE_PROJECT_REF $OUTPUT_FILE"
    exit 1
fi

# Extract password for display (masked)
if [[ $CONN_STRING == *":"*"@"* ]]; then
    MASKED_CONN=$(echo "$CONN_STRING" | sed 's/:[^@]*@/:****@/')
    echo -e "${BLUE}Using connection:${NC} $MASKED_CONN"
fi

echo ""
echo -e "${YELLOW}Exporting schema (this may take a few minutes)...${NC}"

# Export schema only (no data)
"$PG_DUMP" "$CONN_STRING" \
    --schema-only \
    --no-owner \
    --no-acl \
    --schema=public \
    --verbose \
    -f "$OUTPUT_FILE" 2>&1 | tee "${OUTPUT_FILE}.log"

if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
    echo ""
    echo -e "${GREEN}✅ Schema exported successfully!${NC}"
    echo -e "${BLUE}File:${NC} $OUTPUT_FILE"
    echo -e "${BLUE}Size:${NC} $(wc -l < "$OUTPUT_FILE") lines"
    echo -e "${BLUE}Log:${NC} ${OUTPUT_FILE}.log"
    echo ""
    echo "Next step: Import to target project"
    echo "  ./scripts/import-schema-pgdump.sh $OUTPUT_FILE fhqglhcjlkusrykqnoel"
else
    echo -e "${RED}❌ Export failed${NC}"
    echo "Check the log file: ${OUTPUT_FILE}.log"
    exit 1
fi
