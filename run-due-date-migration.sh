#!/bin/bash

echo "🔧 [DUE-DATE-MIGRATION] Running due_date column migration..."
echo "🔧 [DUE-DATE-MIGRATION] This will add the due_date column to the projects table"

# Check if the SQL file exists
if [ ! -f "sql-queriers/add-due-date-column.sql" ]; then
    echo "❌ [DUE-DATE-MIGRATION] SQL file not found: sql-queriers/add-due-date-column.sql"
    exit 1
fi

echo "📄 [DUE-DATE-MIGRATION] Found SQL file: sql-queriers/add-due-date-column.sql"
echo "📄 [DUE-DATE-MIGRATION] Contents:"
echo "----------------------------------------"
cat sql-queriers/add-due-date-column.sql
echo "----------------------------------------"

echo ""
echo "💡 [DUE-DATE-MIGRATION] To run this migration:"
echo "   1. Copy the SQL above"
echo "   2. Go to your Supabase dashboard"
echo "   3. Navigate to SQL Editor"
echo "   4. Paste and run the SQL"
echo ""
echo "   OR run via psql:"
echo "   psql -h your-host -U your-user -d your-database -f sql-queriers/add-due-date-column.sql"
echo ""
echo "✅ [DUE-DATE-MIGRATION] Migration script ready!"
