#!/bin/bash

# Tutorial System Migration Script
# This script creates the tutorial_configs table and sets up the necessary database structure

echo "🚀 Setting up Tutorial System Database..."

# Check if we're in the right directory
if [ ! -f "sql-queriers/create-tutorial-configs-table.sql" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Creating tutorial_configs table and policies..."

# Run the SQL migration
if command -v psql &> /dev/null; then
    echo "🔧 Running migration with psql..."
    psql -h localhost -U postgres -d postgres -f sql-queriers/create-tutorial-configs-table.sql
elif command -v supabase &> /dev/null; then
    echo "🔧 Running migration with Supabase CLI..."
    supabase db reset --linked
    supabase db push
else
    echo "⚠️  Neither psql nor Supabase CLI found."
    echo "📝 Please run the following SQL manually in your Supabase dashboard:"
    echo ""
    cat sql-queriers/create-tutorial-configs-table.sql
    echo ""
    echo "🔗 Or copy the SQL from: sql-queriers/create-tutorial-configs-table.sql"
fi

echo ""
echo "✅ Tutorial system database setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Add the TutorialOverlay component to your pages"
echo "2. Add data-welcome attributes to elements you want to highlight"
echo "3. Test the tutorial system"
echo ""
echo "📖 Example usage:"
echo '<div data-welcome='\''{"title": "Welcome!", "msg": "This is the dashboard", "position": "bottom"}'\''>'
echo "  Dashboard Content"
echo "</div>"
