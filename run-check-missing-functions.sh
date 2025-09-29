#!/bin/bash
echo "Check what functions are missing and what they might have been doing:"
echo "---------------------------------------------------------"
cat sql-queriers/check-missing-functions.sql
echo "---------------------------------------------------------"
echo "This will help identify which functions were actually necessary"
echo "and what functionality might be missing now."
echo ""
echo "Run this to see what's left and what might be broken."
