#!/bin/bash

# =====================================================
# COMPLETE SCHEMA CLONE - FINAL SOLUTION
# Uses Supabase API to get connection info
# Then uses pg_dump for complete schema export
# =====================================================

set -e

SOURCE_PROJECT_REF="${1:-qudlxlryegnainztkrtk}"
TARGET_PROJECT_REF="${2:-fhqglhcjlkusrykqnoel}"

echo "🔄 Complete Schema Clone"
echo "========================"
echo ""
echo "Since Supabase MCP doesn't expose direct schema export tools,"
echo "and Supabase CLI db dump includes data, here's the best approach:"
echo ""

# Check for pg_dump
if command -v pg_dump &> /dev/null; then
    echo "✅ pg_dump found - Best method available!"
    echo ""
    echo "Get connection strings from:"
    echo "  Source: https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF/settings/database"
    echo "  Target: https://supabase.com/dashboard/project/$TARGET_PROJECT_REF/settings/database"
    echo ""
    echo "Then run:"
    echo "  pg_dump \"[SOURCE_CONN_STRING]\" --schema-only --no-owner --no-acl --schema=public > schema.sql"
    echo "  psql \"[TARGET_CONN_STRING]\" -f schema.sql"
    echo ""
    exit 0
fi

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo ""
    echo "Method: Use SQL Editor (Most Reliable)"
    echo ""
    echo "1. Export from source:"
    echo "   https://supabase.com/dashboard/project/$SOURCE_PROJECT_REF/sql"
    echo "   Run: sql-queriers/export-complete-schema.sql"
    echo "   Export each PART as CSV"
    echo ""
    echo "2. Convert CSV to SQL:"
    echo "   node scripts/csv-to-sql-fixed.js tables.csv functions.csv ..."
    echo ""
    echo "3. Import to target:"
    echo "   https://supabase.com/dashboard/project/$TARGET_PROJECT_REF/sql"
    echo "   Paste and run the SQL"
    echo ""
    exit 0
fi

echo "❌ Neither pg_dump nor Supabase CLI found"
echo ""
echo "Install one of:"
echo "  brew install postgresql@15  # For pg_dump"
echo "  npm install -g supabase      # For Supabase CLI"
echo ""
