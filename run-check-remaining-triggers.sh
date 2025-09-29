#!/bin/bash
echo "Check for any remaining triggers that might be causing the company_name error:"
echo "---------------------------------------------------------"
cat sql-queriers/check-remaining-triggers.sql
echo "---------------------------------------------------------"
echo "This will help identify what's still active and causing the error."
echo "Run this in Supabase SQL Editor to see what triggers and functions are still active."
