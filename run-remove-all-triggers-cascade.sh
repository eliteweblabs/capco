#!/bin/bash
echo "NUCLEAR OPTION WITH CASCADE: Remove ALL triggers and functions"
echo "---------------------------------------------------------"
cat sql-queriers/remove-all-project-triggers-cascade.sql
echo "---------------------------------------------------------"
echo "This will remove ALL triggers and functions with CASCADE to handle dependencies."
echo ""
echo "⚠️  WARNING: This will remove ALL project-related triggers and functions."
echo "You may need to recreate some functionality after this."
echo ""
echo "After running this, try creating a project again."
