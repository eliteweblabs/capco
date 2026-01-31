#!/bin/bash

# =====================================================
# PULL REMOTE DATABASE TO LOCAL
# Note: This can be complex due to storage/auth conflicts
# Consider using remote database directly for local dev
# =====================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Pull Remote Database Schema${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${YELLOW}This will pull your remote schema to local migrations.${NC}"
echo -e "${YELLOW}Applying it locally can be complex due to storage/auth schema conflicts.${NC}"
echo ""
echo -e "${BLUE}Recommended: Use remote DB directly by setting these in your .env:${NC}"
echo "  PUBLIC_SUPABASE_URL=your-remote-url"
echo "  PUBLIC_SUPABASE_ANON_KEY=your-remote-key"
echo ""
echo -e "${BLUE}Continue with pull anyway? (y/n):${NC} "
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📥 Pulling remote schema...${NC}"
supabase db pull

echo ""
echo -e "${GREEN}✅ Schema pulled successfully!${NC}"
echo ""
echo -e "${YELLOW}New migration file created in: supabase/migrations/${NC}"
echo ""
echo -e "${BLUE}To apply locally (may fail due to storage conflicts):${NC}"
echo "  supabase stop"
echo "  supabase start"  
echo "  supabase db reset --no-seed"
