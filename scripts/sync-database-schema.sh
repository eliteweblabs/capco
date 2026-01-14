#!/bin/bash

# =====================================================
# SYNC DATABASE SCHEMA BETWEEN SUPABASE PROJECTS
# This script helps sync database schemas between
# different Supabase projects (dev, staging, production)
# =====================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SQL_DIR="$PROJECT_ROOT/sql-queriers"

echo -e "${GREEN}🔧 Database Schema Sync Tool${NC}"
echo "=================================="
echo ""

# Function to run SQL file on Supabase
run_sql_file() {
    local file=$1
    local project_url=$2
    local api_key=$3
    
    echo -e "${YELLOW}Running: $file${NC}"
    
    # Check if using Supabase CLI
    if command -v supabase &> /dev/null; then
        echo "Using Supabase CLI..."
        # You can use: supabase db push or supabase db execute
        echo "To execute this file, run:"
        echo "  supabase db execute --file $file"
        echo ""
    else
        echo -e "${YELLOW}Supabase CLI not found.${NC}"
        echo "Please run this SQL file manually in your Supabase dashboard:"
        echo "  1. Go to your Supabase project dashboard"
        echo "  2. Navigate to SQL Editor"
        echo "  3. Copy and paste the contents of: $file"
        echo "  4. Execute the script"
        echo ""
    fi
}

# Function to sync notifications schema
sync_notifications() {
    echo -e "${GREEN}📋 Syncing notifications table schema...${NC}"
    run_sql_file "$SQL_DIR/sync-notifications-schema.sql" "$@"
}

# Function to list all schema files
list_schemas() {
    echo -e "${GREEN}📚 Available schema files:${NC}"
    echo ""
    find "$SQL_DIR" -name "*.sql" -type f | grep -E "(create-|sync-|migration)" | sort
    echo ""
}

# Function to sync all critical schemas
sync_all() {
    echo -e "${GREEN}🔄 Syncing all critical schemas...${NC}"
    echo ""
    
    # List of critical schema files in order
    local schemas=(
        "create-notifications-table.sql"
        "sync-notifications-schema.sql"
    )
    
    for schema in "${schemas[@]}"; do
        local file="$SQL_DIR/$schema"
        if [ -f "$file" ]; then
            run_sql_file "$file" "$@"
        else
            echo -e "${RED}⚠️  File not found: $file${NC}"
        fi
    done
}

# Main menu
show_menu() {
    echo "Select an option:"
    echo "  1) Sync notifications schema only"
    echo "  2) List all available schema files"
    echo "  3) Sync all critical schemas"
    echo "  4) Exit"
    echo ""
    read -p "Enter choice [1-4]: " choice
    
    case $choice in
        1)
            sync_notifications
            ;;
        2)
            list_schemas
            ;;
        3)
            sync_all
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            show_menu
            ;;
    esac
}

# Check if running interactively
if [ -t 0 ]; then
    show_menu
else
    # Non-interactive mode - sync notifications by default
    sync_notifications
fi

echo -e "${GREEN}✅ Schema sync process completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the SQL files in: $SQL_DIR"
echo "  2. Run them in your Supabase dashboard SQL Editor"
echo "  3. Or use Supabase CLI: supabase db push"
