#!/bin/bash

# =====================================================
# EXPORT SUPABASE SCHEMA (Schema Only)
# Exports complete schema including:
# - Tables, columns, constraints
# - Functions, triggers, views
# - RLS policies
# - Indexes
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_REF="${1:-qudlxlryegnainztkrtk}"
OUTPUT_FILE="${2:-supabase-schema-export.sql}"

echo -e "${GREEN}📤 Exporting Supabase Schema${NC}"
echo "=================================="
echo -e "${BLUE}Project:${NC} $PROJECT_REF"
echo -e "${BLUE}Output:${NC} $OUTPUT_FILE"
echo ""

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    exit 1
fi

# Link to project
echo -e "${YELLOW}Linking to project...${NC}"
supabase link --project-ref "$PROJECT_REF" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Project may already be linked or needs manual linking${NC}"
}

# Export schema
echo -e "${YELLOW}Exporting schema...${NC}"
supabase db dump \
    --schema public \
    --schema-only \
    --no-data \
    --no-owner \
    --no-acl \
    > "$OUTPUT_FILE" 2>&1

if [ $? -eq 0 ] && [ -s "$OUTPUT_FILE" ]; then
    echo -e "${GREEN}✅ Schema exported successfully!${NC}"
    echo -e "${BLUE}File:${NC} $OUTPUT_FILE"
    echo -e "${BLUE}Size:${NC} $(wc -l < "$OUTPUT_FILE") lines"
else
    echo -e "${RED}❌ Export failed${NC}"
    echo "Trying alternative method..."
    
    # Alternative: Generate SQL queries to export schema
    cat > "$OUTPUT_FILE" << 'EOF'
-- =====================================================
-- SUPABASE SCHEMA EXPORT
-- Generated schema export script
-- =====================================================

-- Export all table structures
SELECT 
    'CREATE TABLE IF NOT EXISTS ' || tablename || ' (' ||
    string_agg(
        quote_ident(column_name) || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || COALESCE(character_maximum_length::text, '255') || ')'
            WHEN data_type = 'character' THEN 'CHAR(' || COALESCE(character_maximum_length::text, '1') || ')'
            WHEN data_type = 'numeric' THEN 'NUMERIC(' || COALESCE(numeric_precision::text, '') || 
                CASE WHEN numeric_scale > 0 THEN ',' || numeric_scale::text ELSE '' END || ')'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ', '
        ORDER BY ordinal_position
    ) || ');' as create_statement
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
GROUP BY tablename
ORDER BY tablename;

-- Export all functions
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- Export all triggers
SELECT pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE NOT tgisinternal
ORDER BY tgname;

-- Export all RLS policies
SELECT 
    'CREATE POLICY ' || quote_ident(polname) || ' ON ' || 
    quote_ident(schemaname) || '.' || quote_ident(tablename) || ' ' ||
    polcmd || ' ' ||
    CASE WHEN polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END || ' ' ||
    'FOR ' || polroles::text || ' ' ||
    CASE 
        WHEN polqual IS NOT NULL THEN 'USING (' || polqual::text || ') '
        ELSE ''
    END ||
    CASE 
        WHEN polwithcheck IS NOT NULL THEN 'WITH CHECK (' || polwithcheck::text || ') '
        ELSE ''
    END || ';' as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Export all indexes
SELECT indexdef || ';' as index_definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
EOF

    echo -e "${YELLOW}⚠️  Created SQL query file instead${NC}"
    echo "Run these queries in Supabase SQL Editor to export schema"
fi

echo ""
echo -e "${GREEN}✅ Export complete!${NC}"
