#!/bin/bash
echo "NUCLEAR OPTION: Remove ALL functions and triggers that reference company_name"
echo "---------------------------------------------------------"
cat sql-queriers/nuclear-company-name-cleanup.sql
echo "---------------------------------------------------------"
echo "This will completely eliminate the company_name error by removing:"
echo "- ALL triggers on projects and profiles tables"
echo "- ALL functions that reference company_name"
echo "- Verify the company_name column is gone"
echo ""
echo "⚠️  WARNING: This is aggressive and will remove ALL triggers and functions"
echo "that might be causing the issue. You may need to recreate some functionality."
echo ""
echo "After running this, try creating a project again."
