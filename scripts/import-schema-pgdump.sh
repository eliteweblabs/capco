#!/bin/bash

# =====================================================
# IMPORT SUPABASE SCHEMA USING psql
# Imports a schema SQL file to a Supabase project
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SCHEMA_FILE="${1}"
TARGET_PROJECT_REF="${2:-fhqglhcjlkusrykqnoel}"

if [ -z "$SCHEMA_FILE" ] || [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file required${NC}"
    echo "Usage: $0 <schema-file.sql> [target-project-ref]"
    exit 1
fi

echo -e "${GREEN}📥 Importing Supabase Schema (psql)${NC}"
echo "=================================="
echo -e "${BLUE}File:${NC} $SCHEMA_FILE"
echo -e "${BLUE}Target Project:${NC} $TARGET_PROJECT_REF"
echo ""

# Find psql (check multiple locations)
PSQL=""
if command -v psql &> /dev/null; then
    PSQL="psql"
elif [ -f "/opt/homebrew/opt/postgresql@15/bin/psql" ]; then
    PSQL="/opt/homebrew/opt/postgresql@15/bin/psql"
elif [ -f "/usr/local/opt/postgresql@15/bin/psql" ]; then
    PSQL="/usr/local/opt/postgresql@15/bin/psql"
elif [ -f "$(brew --prefix postgresql@15)/bin/psql" ]; then
    PSQL="$(brew --prefix postgresql@15)/bin/psql"
else
    echo -e "${RED}❌ psql not found${NC}"
    echo "PostgreSQL is installed but psql not in PATH."
    echo "Try:"
    echo "  export PATH=\"\$(brew --prefix postgresql@15)/bin:\$PATH\""
    echo "  $0 $SCHEMA_FILE $TARGET_PROJECT_REF"
    exit 1
fi

echo -e "${GREEN}✅ psql found: $PSQL${NC}"
echo ""

# Get connection string
echo -e "${YELLOW}📋 Connection Details Needed:${NC}"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$TARGET_PROJECT_REF"
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
    echo "  $0 $SCHEMA_FILE $TARGET_PROJECT_REF"
    exit 1
fi

# Mask password
if [[ $CONN_STRING == *":"*"@"* ]]; then
    MASKED_CONN=$(echo "$CONN_STRING" | sed 's/:[^@]*@/:****@/')
    echo -e "${BLUE}Using connection:${NC} $MASKED_CONN"
fi

echo ""
echo -e "${RED}⚠️  WARNING: This will modify the target database!${NC}"
echo -e "${YELLOW}The schema will be imported to: $TARGET_PROJECT_REF${NC}"
read -p "Continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Importing schema (this may take several minutes)...${NC}"

# Import schema
"$PSQL" "$CONN_STRING" \
    -f "$SCHEMA_FILE" \
    --echo-errors \
    --verbose \
    2>&1 | tee "${SCHEMA_FILE%.sql}-import.log"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Schema import completed!${NC}"
    echo -e "${BLUE}Log:${NC} ${SCHEMA_FILE%.sql}-import.log"
    echo ""
    echo "Review any warnings/errors in the log file above."
    echo "Some 'already exists' errors are normal and can be ignored."
else
    echo ""
    echo -e "${YELLOW}⚠️  Import completed with some errors${NC}"
    echo "Review the log file: ${SCHEMA_FILE%.sql}-import.log"
    echo "Some errors (like 'already exists') are normal and can be ignored."
fi
