#!/bin/bash

# Query Capco schema and save to JSON files
# This script uses Supabase MCP or direct SQL connection

echo "📋 Querying Capco (Master) schema..."
echo "Project: qudlxlryegnainztkrtk"
echo ""

# Note: This requires Supabase MCP connection to Capco project
# Or run the SQL queries manually in Supabase SQL Editor

echo "Run these queries on Capco database:"
echo "1. sql-queriers/get-capco-schema.sql"
echo "2. Export results as JSON"
echo "3. Save as: capco-tables.json and capco-columns.json"
echo ""
echo "Then run:"
echo "  node scripts/sync-rothco-to-capco-schema.js \\"
echo "    --capco-tables capco-tables.json \\"
echo "    --capco-columns capco-columns.json \\"
echo "    --rothco-tables rothco-schema-tables.json \\"
echo "    --rothco-columns rothco-schema-columns.json \\"
echo "    --output sync-rothco-to-capco.sql"
