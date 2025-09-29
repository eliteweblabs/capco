#!/bin/bash
echo "Find the specific functions that are causing the company_name error:"
echo "---------------------------------------------------------"
cat sql-queriers/find-problematic-functions.sql
echo "---------------------------------------------------------"
echo "Run each section separately in Supabase SQL Editor to get detailed results:"
echo ""
echo "1. First run the functions section to see which functions reference company_name"
echo "2. Then run the triggers sections to see what triggers are active"
echo "3. Finally check if the company_name column still exists"
echo ""
echo "This will help identify exactly what's causing the error."
