#!/bin/bash

# =====================================================
# SIMPLE CSV TO SQL CONVERTER
# Extracts CREATE statements from CSV exports
# =====================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

if [ $# -eq 0 ]; then
    echo -e "${RED}❌ No CSV files provided${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 <csv-file-1> [csv-file-2] ..."
    echo ""
    echo "Example:"
    echo "  $0 tables.csv functions.csv triggers.csv"
    exit 1
fi

OUTPUT_FILE="schema-import-$(date +%Y%m%d-%H%M%S).sql"

echo -e "${GREEN}🔄 Converting CSV to SQL${NC}"
echo "======================================"
echo ""

# Create output file with header
cat > "$OUTPUT_FILE" << 'EOF'
-- =====================================================
-- SCHEMA IMPORT - Generated from CSV export
-- =====================================================

EOF

# Process each CSV file
for csv_file in "$@"; do
    if [ ! -f "$csv_file" ]; then
        echo -e "${YELLOW}⚠️  File not found: $csv_file${NC}"
        continue
    fi
    
    echo -e "${BLUE}Processing: $csv_file${NC}"
    
    # Extract SQL statements from CSV
    # Method 1: If CSV has CREATE statements in first column
    # Remove quotes, extract first column, filter for SQL statements
    awk -F',' '
    {
        # Get first column (SQL statement)
        sql = $1;
        
        # Remove surrounding quotes if present
        gsub(/^"/, "", sql);
        gsub(/"$/, "", sql);
        
        # Unescape CSV quotes
        gsub(/""/, "\"", sql);
        
        # Only include lines that look like SQL
        if (sql ~ /CREATE|ALTER|--|SELECT|INSERT/ && length(sql) > 5) {
            # Ensure semicolon at end for CREATE/ALTER
            if (sql ~ /^CREATE|^ALTER/ && sql !~ /;$/) {
                sql = sql ";";
            }
            print sql;
        }
    }
    ' "$csv_file" >> "$OUTPUT_FILE"
    
    echo "" >> "$OUTPUT_FILE"
    echo -e "${GREEN}  ✅ Processed${NC}"
done

echo ""
echo -e "${GREEN}✅ Conversion complete!${NC}"
echo -e "${BLUE}Output file: $OUTPUT_FILE${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the SQL file: $OUTPUT_FILE"
echo "2. Go to target project SQL Editor:"
echo "   https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql"
echo "3. Copy and paste the SQL statements"
echo "4. Run the SQL"
