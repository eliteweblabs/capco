#!/bin/bash
echo "NUCLEAR OPTION: Drop ALL triggers and functions that might reference company_name"
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "---------------------------------------------------------"
cat sql-queriers/drop-all-company-name-triggers.sql
echo "---------------------------------------------------------"
echo "This will completely remove any triggers that might be causing the error."
echo "After running this, try creating a project again."
