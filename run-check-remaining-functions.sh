#!/bin/bash
echo "Check remaining functions for company_name references"
echo "---------------------------------------------------------"
cat sql-queriers/check-remaining-functions.sql
echo "---------------------------------------------------------"
echo "This will check if the remaining functions contain company_name references."
echo "If they do, we'll need to drop them too."
