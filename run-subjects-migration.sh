#!/bin/bash

# Script to run the subjects table migration
echo "🚀 Running subjects table migration..."

# Check if we're in the right directory
if [ ! -f "sql-queriers/create-subjects-table.sql" ]; then
    echo "❌ Error: create-subjects-table.sql not found. Please run this script from the project root."
    exit 1
fi

echo "📝 Creating subjects table and inserting default data..."
echo "⚠️  Please run the following SQL in your Supabase SQL editor:"
echo ""
echo "--- Copy and paste this into Supabase SQL Editor ---"
cat sql-queriers/create-subjects-table.sql
echo ""
echo "--- End of SQL ---"
echo ""
echo "✅ After running the SQL, the subjects table will be ready!"
echo "📊 The new system will:"
echo "   - Store subjects independently from invoices"
echo "   - Track usage counts for better organization"
echo "   - Allow for better categorization and search"
echo "   - Enable optimized API calls with full object passing"
