#!/bin/bash

# Script to fix the filesGlobal sequence issue
# This will ensure the sequence exists and is properly configured

echo "🔧 Fixing filesGlobal sequence issue..."
echo "========================================"

SQL_FILE="sql-queriers/fix-files-global-sequence.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL file not found at $SQL_FILE"
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found. Please install it first."
    echo "   Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "📝 Running SQL migration..."
supabase db execute -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ filesGlobal sequence fixed successfully!"
    echo ""
    echo "The table is now properly configured with:"
    echo "  - Auto-incrementing ID sequence"
    echo "  - NOT NULL constraint on id"
    echo "  - Primary key on id"
else
    echo "❌ Failed to apply SQL migration"
    exit 1
fi
