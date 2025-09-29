#!/bin/bash
echo "EMERGENCY: Drop all functions that might be causing company_name errors"
echo "---------------------------------------------------------"
cat sql-queriers/emergency-drop-company-name-functions.sql
echo "---------------------------------------------------------"
echo "This is a more aggressive approach to fix the issue."
echo "After running this, try creating a project again."
