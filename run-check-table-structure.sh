#!/bin/bash
echo "Check the exact structure of the projects table:"
echo "---------------------------------------------------------"
cat sql-queriers/check-projects-table-structure.sql
echo "---------------------------------------------------------"
echo "This will help identify if the company_name column still exists"
echo "and what the current structure of the projects table looks like."
echo ""
echo "Run this to see the exact table structure and identify any issues."
