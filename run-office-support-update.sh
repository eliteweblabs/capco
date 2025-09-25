#!/bin/bash

# Script to update storage buckets for Office document support
# This script runs the SQL update to add Office document MIME types to all storage buckets

echo "🔧 Updating storage buckets for Office document support..."

# Check if we're in the right directory
if [ ! -f "sql-queriers/update-all-buckets-office-support.sql" ]; then
    echo "❌ Error: SQL file not found. Please run this script from the project root directory."
    exit 1
fi

echo "📋 SQL script found. Please run the following SQL in your Supabase dashboard:"
echo ""
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of: sql-queriers/update-all-buckets-office-support.sql"
echo "4. Click 'Run' to execute the script"
echo ""
echo "This will update all storage buckets to support:"
echo "  ✅ Word documents (.doc, .docx)"
echo "  ✅ Excel spreadsheets (.xls, .xlsx)"
echo "  ✅ PowerPoint presentations (.ppt, .pptx)"
echo "  ✅ PDF files"
echo "  ✅ Text files (.txt, .csv, .rtf)"
echo "  ✅ AutoCAD files (.dwg, .dxf, etc.)"
echo "  ✅ Archive files (.zip, .rar, etc.)"
echo "  ✅ Images, videos, and audio files"
echo ""
echo "After running the SQL script, try uploading your Word document again."
