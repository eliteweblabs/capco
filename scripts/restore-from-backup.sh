#!/bin/bash

# =====================================================
# RESTORE FROM SUPABASE BACKUP
# Downloads and restores a Supabase backup to local
# =====================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔄 Restore from Supabase Backup${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found!${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}Options:${NC}"
echo "  1. Download pg_dump from Supabase (requires connection string)"
echo "  2. Use Supabase CLI db dump (simpler)"
echo ""
echo -e "${BLUE}Choose option (1 or 2):${NC} "
read -r option

if [[ "$option" == "1" ]]; then
    echo ""
    echo -e "${YELLOW}You'll need your database connection string from:${NC}"
    echo "  Supabase Dashboard → Settings → Database → Connection String"
    echo ""
    echo -e "${BLUE}Enter your connection string:${NC}"
    read -r DB_URL
    
    DUMP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    echo ""
    echo -e "${BLUE}📥 Downloading backup...${NC}"
    pg_dump "$DB_URL" > "$DUMP_FILE"
    
    echo ""
    echo -e "${GREEN}✅ Backup saved to: $DUMP_FILE${NC}"
    echo ""
    echo -e "${BLUE}To restore to local Supabase:${NC}"
    echo "  1. supabase db reset"
    echo "  2. psql postgresql://postgres:postgres@localhost:54322/postgres < $DUMP_FILE"
    
elif [[ "$option" == "2" ]]; then
    echo ""
    echo -e "${BLUE}📥 Creating dump with Supabase CLI...${NC}"
    
    DUMP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # This dumps the remote database schema and data
    supabase db dump --data-only > "$DUMP_FILE"
    
    echo ""
    echo -e "${GREEN}✅ Backup saved to: $DUMP_FILE${NC}"
    echo ""
    echo -e "${BLUE}To restore to local:${NC}"
    echo "  1. supabase start"
    echo "  2. supabase db reset --no-seed"
    echo "  3. psql postgresql://postgres:postgres@localhost:54322/postgres < $DUMP_FILE"
else
    echo -e "${RED}Invalid option${NC}"
    exit 1
fi
