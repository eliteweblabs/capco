#!/bin/bash
echo "Check if the elapsed_time functions are actually active:"
echo "---------------------------------------------------------"
cat sql-queriers/check-elapsed-time-functions.sql
echo "---------------------------------------------------------"
echo "This will show you what's currently working in your database."
echo "Run this to see if the functions exist even if you delete the SQL file."
