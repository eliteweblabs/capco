#!/bin/bash
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "---------------------------------------------------------"
cat sql-queriers/fix-company-name-triggers.sql
echo "---------------------------------------------------------"
echo "After running the SQL, restart your development server."
echo ""
echo "This fixes all database triggers that were causing the"
echo "'record new has no field company_name' error."
