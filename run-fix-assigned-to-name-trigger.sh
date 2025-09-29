#!/bin/bash
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "---------------------------------------------------------"
cat sql-queriers/fix-assigned-to-name-trigger.sql
echo "---------------------------------------------------------"
echo "After running the SQL, restart your development server."
echo ""
echo "This fixes the 'column reference company_name is ambiguous' error"
echo "by making the database triggers more explicit about table references."
