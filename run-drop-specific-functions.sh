#!/bin/bash
echo "Drop the specific functions that are causing the company_name error:"
echo "---------------------------------------------------------"
cat sql-queriers/drop-specific-company-name-functions.sql
echo "---------------------------------------------------------"
echo "These functions are trying to reference company_name in projects table"
echo "which no longer exists. After running this, try creating a project again."
