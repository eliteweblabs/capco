#!/bin/bash
echo "Find triggers that might be trying to sync company_name from profiles to projects:"
echo "---------------------------------------------------------"
cat sql-queriers/find-sync-triggers.sql
echo "---------------------------------------------------------"
echo "This will identify the exact trigger causing the error."
echo "The issue is likely a trigger trying to copy company_name from profiles to projects."
echo ""
echo "Run this in Supabase SQL Editor to find the problematic trigger."
