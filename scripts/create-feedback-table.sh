#!/bin/bash

# Script to create the feedback table in Supabase
# Usage: ./create-feedback-table.sh

echo "🚀 Creating feedback table in Supabase..."
echo ""

# Check if SUPABASE_URL and SUPABASE_KEY environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables must be set"
  echo ""
  echo "Example:"
  echo "export SUPABASE_URL=https://your-project.supabase.co"
  echo "export SUPABASE_KEY=your-anon-key"
  exit 1
fi

# Path to SQL file
SQL_FILE="sql-queriers/create-feedback-table.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: SQL file not found at $SQL_FILE"
  exit 1
fi

echo "📄 Reading SQL file: $SQL_FILE"
echo ""

# Execute SQL using Supabase REST API
curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"$(cat $SQL_FILE | sed 's/"/\\"/g' | tr '\n' ' ')\"}"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Feedback table created successfully!"
  echo ""
  echo "You can now:"
  echo "  1. Submit feedback via the feedback widget"
  echo "  2. View feedback in the Supabase dashboard"
  echo "  3. Create an admin page to manage feedback"
else
  echo ""
  echo "❌ Error creating feedback table"
  exit 1
fi
