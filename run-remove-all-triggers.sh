#!/bin/bash
echo "NUCLEAR OPTION: Remove ALL triggers on projects table to eliminate company_name errors"
echo "---------------------------------------------------------"
cat sql-queriers/remove-all-project-triggers.sql
echo "---------------------------------------------------------"
echo "This will remove ALL triggers and functions that might be causing the error."
echo ""
echo "⚠️  WARNING: This will remove ALL project-related triggers and functions."
echo "You may need to recreate some functionality after this."
echo ""
echo "After running this, try creating a project again."
