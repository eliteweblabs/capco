#!/bin/bash
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "---------------------------------------------------------"
cat sql-queriers/remove-company-name-from-projects.sql
echo "---------------------------------------------------------"
echo "After running the SQL, restart your development server."
echo ""
echo "This removes the redundant company_name column from projects table"
echo "and eliminates the ambiguous column reference error."
