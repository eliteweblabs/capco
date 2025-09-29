#!/bin/bash
echo "Drop the specific trigger and function that's causing the company_name error:"
echo "---------------------------------------------------------"
cat sql-queriers/drop-sync-company-name-trigger.sql
echo "---------------------------------------------------------"
echo "This will remove:"
echo "- trigger_sync_company_name (the trigger)"
echo "- sync_company_name_to_projects() (the function)"
echo ""
echo "After running this, try creating a project again - the error should be fixed!"
