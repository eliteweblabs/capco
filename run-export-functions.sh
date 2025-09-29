#!/bin/bash
echo "Export all functions and triggers to analyze for company_name references:"
echo "---------------------------------------------------------"
cat sql-queriers/export-all-functions.sql
echo "---------------------------------------------------------"
echo "This will give you a complete view of what's in your database."
echo "Copy the results and save them to a text file for analysis."
echo ""
echo "After running this, you can:"
echo "1. Copy the results to a text file"
echo "2. Search for 'company_name' in the results"
echo "3. Identify which functions are causing the error"
