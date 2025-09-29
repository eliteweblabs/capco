#!/bin/bash
echo "Check which functions are actually active and working:"
echo "---------------------------------------------------------"
cat sql-queriers/check-active-functions.sql
echo "---------------------------------------------------------"
echo "This will show you which triggers and functions are currently active,"
echo "so you can identify duplicates and see what's actually working."
