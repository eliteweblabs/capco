#!/bin/bash

# Run the auto-update-updatedAt trigger SQL script
# This sets up automatic updatedAt column updates for the projects table

echo "🔧 Setting up auto-update trigger for projects.updatedAt..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Load DATABASE_URL from .env
export $(grep -v '^#' .env | grep DATABASE_URL | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env"
    exit 1
fi

# Run the SQL script
psql "$DATABASE_URL" -f sql-queriers/auto-update-updatedAt-trigger.sql

if [ $? -eq 0 ]; then
    echo "✅ Trigger created successfully!"
    echo "   updatedAt will now automatically update on any projects table change"
else
    echo "❌ Failed to create trigger"
    exit 1
fi
