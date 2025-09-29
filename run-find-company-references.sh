#!/bin/bash
echo "Simple script to find ALL company_name references in your database:"
echo "---------------------------------------------------------"
cat sql-queriers/find-company-name-references.sql
echo "---------------------------------------------------------"
echo "This will show you exactly what's referencing company_name"
echo "and causing the 'record new has no field company_name' error."
echo ""
echo "Run this in Supabase SQL Editor and look for:"
echo "- Functions that reference company_name"
echo "- Triggers that might be calling these functions"
echo "- Any views that reference company_name"
echo "- Whether the company_name column still exists"
