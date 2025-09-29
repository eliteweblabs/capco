#!/bin/bash
echo "Find the exact functions causing the company_name error:"
echo "---------------------------------------------------------"
cat sql-queriers/find-company-name-functions.sql
echo "---------------------------------------------------------"
echo "This will show you the function definitions and triggers"
echo "that are causing the 'record new has no field company_name' error."
