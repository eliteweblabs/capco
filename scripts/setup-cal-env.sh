#!/bin/bash

# Cal.com Environment Setup Script
echo "Setting up Cal.com environment variables..."

# Set required environment variables for Cal.com
export SUPABASE_DB_PASSWORD="your-supabase-db-password-here"
export NEXTAUTH_SECRET="your-secret-key-for-local-development"
export CALENDSO_ENCRYPTION_KEY="your-encryption-key-for-local-development-32-chars"

echo "Environment variables set. You can now run:"
echo "docker-compose -f docker-compose.cal.yml up -d"
echo ""
echo "IMPORTANT: Replace 'your-supabase-db-password-here' with your actual Supabase database password!"
echo "You can find this in your Supabase project settings under Database > Connection string"
