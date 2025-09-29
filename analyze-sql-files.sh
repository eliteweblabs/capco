#!/bin/bash

echo "=== SQL QUERIERS ANALYSIS ==="
echo "Total files: $(ls sql-queriers/*.sql | wc -l)"
echo ""

echo "=== CATEGORIES ==="
echo ""

echo "🔧 COMPANY_NAME RELATED (can probably delete most):"
ls sql-queriers/*company* sql-queriers/*Company* 2>/dev/null || echo "None found"

echo ""
echo "📊 DEMO DATA (can probably delete):"
ls sql-queriers/*demo* sql-queriers/*Demo* 2>/dev/null || echo "None found"

echo ""
echo "🔒 RLS/SECURITY (keep the latest ones):"
ls sql-queriers/*rls* sql-queriers/*RLS* sql-queriers/*security* sql-queriers/*secure* 2>/dev/null || echo "None found"

echo ""
echo "🗃️ TABLE CREATION (keep the latest ones):"
ls sql-queriers/create-* sql-queriers/setup-* 2>/dev/null || echo "None found"

echo ""
echo "🔧 FIXES/TRIGGERS (keep the latest ones):"
ls sql-queriers/fix-* sql-queriers/update-* 2>/dev/null || echo "None found"

echo ""
echo "📈 PERFORMANCE/MONITORING (can probably delete):"
ls sql-queriers/*performance* sql-queriers/*monitor* 2>/dev/null || echo "None found"

echo ""
echo "=== RECOMMENDED FOR DELETION ==="
echo "Files that are likely outdated or redundant:"
echo ""
echo "Company name related (after we fix the current issue):"
ls sql-queriers/*company* sql-queriers/*Company* 2>/dev/null | grep -v "remove-company-name-from-projects.sql" | grep -v "drop-all-company-name-triggers.sql" | grep -v "drop-specific-company-name-functions.sql" || echo "None found"

echo ""
echo "Demo data (probably not needed in production):"
ls sql-queriers/*demo* sql-queriers/*Demo* 2>/dev/null || echo "None found"

echo ""
echo "Old RLS files (keep only the latest):"
ls sql-queriers/*rls* sql-queriers/*RLS* 2>/dev/null | head -5 || echo "None found"
