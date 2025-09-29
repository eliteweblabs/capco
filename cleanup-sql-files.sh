#!/bin/bash

echo "=== SQL QUERIERS CLEANUP ==="
echo "This script will help you clean up redundant SQL files"
echo ""

# Create backup directory first
mkdir -p sql-queriers-backup

echo "📁 Creating backup of all SQL files..."
cp sql-queriers/*.sql sql-queriers-backup/ 2>/dev/null
echo "✅ Backup created in sql-queriers-backup/"

echo ""
echo "🗑️  Files recommended for deletion:"
echo ""

# Company name related files (after we fix the current issue)
echo "🔧 Company name related files (can delete after fixing current issue):"
echo "sql-queriers/add-company-name-to-projects.sql"
echo "sql-queriers/fix-company-name-triggers.sql" 
echo "sql-queriers/replace-company-name-placeholders.sql"
echo "sql-queriers/sync-company-name-trigger.sql"

echo ""
echo "📊 Demo data files (probably not needed in production):"
echo "sql-queriers/create-demo-bookings-table.sql"
echo "sql-queriers/create-demo-data-simple.sql"
echo "sql-queriers/create-demo-data.sql"
echo "sql-queriers/create-demo-projects-only.sql"
echo "sql-queriers/insert-demo-bookings.sql"
echo "sql-queriers/insert-demo-invoices.sql"
echo "sql-queriers/insert-demo-line-items-catalog.sql"

echo ""
echo "🔒 Old RLS files (keep only the latest):"
echo "sql-queriers/disable-project-statuses-rls.sql"
echo "sql-queriers/emergency-fix-rls.sql"
echo "sql-queriers/enable-rls-security.sql"
echo "sql-queriers/fix-project-statuses-rls-performance.sql"
echo "sql-queriers/fix-punchlist-rls.sql"

echo ""
echo "📈 Performance/monitoring files (can probably delete):"
echo "sql-queriers/database-performance-fixes.sql"
echo "sql-queriers/monitor-database-performance.sql"

echo ""
echo "=== CLEANUP COMMANDS ==="
echo "Run these commands to delete the recommended files:"
echo ""

echo "# Delete company name related files (after fixing current issue):"
echo "rm sql-queriers/add-company-name-to-projects.sql"
echo "rm sql-queriers/fix-company-name-triggers.sql"
echo "rm sql-queriers/replace-company-name-placeholders.sql"
echo "rm sql-queriers/sync-company-name-trigger.sql"

echo ""
echo "# Delete demo data files:"
echo "rm sql-queriers/create-demo-bookings-table.sql"
echo "rm sql-queriers/create-demo-data-simple.sql"
echo "rm sql-queriers/create-demo-data.sql"
echo "rm sql-queriers/create-demo-projects-only.sql"
echo "rm sql-queriers/insert-demo-bookings.sql"
echo "rm sql-queriers/insert-demo-invoices.sql"
echo "rm sql-queriers/insert-demo-line-items-catalog.sql"

echo ""
echo "# Delete old RLS files:"
echo "rm sql-queriers/disable-project-statuses-rls.sql"
echo "rm sql-queriers/emergency-fix-rls.sql"
echo "rm sql-queriers/enable-rls-security.sql"
echo "rm sql-queriers/fix-project-statuses-rls-performance.sql"
echo "rm sql-queriers/fix-punchlist-rls.sql"

echo ""
echo "# Delete performance/monitoring files:"
echo "rm sql-queriers/database-performance-fixes.sql"
echo "rm sql-queriers/monitor-database-performance.sql"

echo ""
echo "=== KEEP THESE IMPORTANT FILES ==="
echo "✅ remove-company-name-from-projects.sql (needed for current fix)"
echo "✅ drop-all-company-name-triggers.sql (needed for current fix)"
echo "✅ drop-specific-company-name-functions.sql (needed for current fix)"
echo "✅ find-all-triggers.sql (useful for debugging)"
echo "✅ secure-rls-policies.sql (latest security)"
echo "✅ simple-secure-rls.sql (latest security)"
echo "✅ supabase_rls_policies.sql (main RLS policies)"
echo "✅ create-subjects-table.sql (if you're using subjects)"
echo "✅ create-notifications-table.sql (if you're using notifications)"
echo "✅ create-punchlist-table.sql (if you're using punchlist)"
echo "✅ create-invoices-table-improved.sql (if you're using invoices)"
