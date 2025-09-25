#!/bin/bash

echo "🔧 PDF Generator Database Migration"
echo "=================================="
echo ""
echo "This script will help you set up the PDF generator database tables."
echo ""
echo "📋 Instructions:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of: sql-queriers/create-pdf-generator-schema-safe.sql"
echo "4. Run the SQL script"
echo ""
echo "📁 The SQL file contains:"
echo "   - PDF templates table"
echo "   - PDF components table" 
echo "   - Template-component mapping"
echo "   - Generated documents tracking"
echo "   - Row Level Security policies"
echo "   - Default template and components"
echo ""
echo "✅ After running the migration, the PDF generation buttons should work!"
echo ""
echo "📄 SQL file location: sql-queriers/create-pdf-generator-schema-safe.sql"
echo ""
echo "Press any key to open the SQL file..."
read -n 1

# Open the SQL file in the default editor
if command -v code &> /dev/null; then
    code sql-queriers/create-pdf-generator-schema-safe.sql
elif command -v nano &> /dev/null; then
    nano sql-queriers/create-pdf-generator-schema-safe.sql
else
    cat sql-queriers/create-pdf-generator-schema-safe.sql
fi
