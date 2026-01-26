#!/bin/bash
# Fix profiles registration issues
# This script applies the SQL fix to both databases

echo "🔧 Fixing profiles registration issues..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required env vars are set
if [ -z "$PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}❌ PUBLIC_SUPABASE_URL is not set${NC}"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ SUPABASE_SERVICE_ROLE_KEY is not set${NC}"
  exit 1
fi

echo -e "${YELLOW}📊 Checking current profiles table status...${NC}"
echo ""

# Execute the SQL fix
SQL_FILE="sql-queriers/fix-profiles-registration.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}❌ SQL file not found: $SQL_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Applying SQL fix from $SQL_FILE${NC}"
echo ""

# Use curl to execute via Supabase REST API
RESPONSE=$(curl -s -X POST \
  "${PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat $SQL_FILE | tr '\n' ' ' | sed 's/"/\\"/g')\"}")

echo "$RESPONSE"
echo ""

echo -e "${GREEN}✅ SQL fix applied successfully!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Try registering a new user"
echo "2. If the error persists, check the server logs for detailed error messages"
echo "3. The registration endpoint now logs detailed error information"
echo ""
