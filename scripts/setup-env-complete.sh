#!/bin/bash

# Complete Environment Setup for Vapi.ai + Appointment System
echo "🔧 Setting up environment variables for your appointment system..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating one..."
    touch .env
fi

echo ""
echo "📝 You need to add these environment variables to your .env file:"
echo ""

# Supabase credentials (required for database)
echo "# Supabase Database Configuration"
echo "SUPABASE_URL=your_supabase_url_here"
echo "SUPABASE_ANON_KEY=your_supabase_anon_key_here"
echo "SUPABASE_URL=your_supabase_url_here"
echo "SUPABASE_ANON_KEY=your_supabase_anon_key_here"
echo ""

# Vapi.ai credentials (for voice assistant)
echo "# Vapi.ai Configuration"
echo "VAPI_API_KEY=your_vapi_api_key_here"
echo "VAPI_WEBHOOK_SECRET=$(openssl rand -base64 32)"
echo ""

# Site configuration
echo "# Site Configuration"
echo "SITE_URL=http://localhost:4321"
echo ""

echo "📋 Next steps:"
echo "1. Get your Supabase credentials from your Supabase dashboard:"
echo "   - Go to Settings > API"
echo "   - Copy Project URL and anon/public key"
echo ""
echo "2. Get your Vapi.ai API key:"
echo "   - Go to https://dashboard.vapi.ai/"
echo "   - Sign up/login and get your API key"
echo ""
echo "3. Add all the variables above to your .env file"
echo ""
echo "4. Run the database schema in Supabase:"
echo "   - Go to your Supabase dashboard > SQL Editor"
echo "   - Copy and paste the contents of sql-queriers/simple-appointments-schema.sql"
echo "   - Click Run"
echo ""
echo "5. Test the system:"
echo "   curl -s http://localhost:4321/api/test-system | jq"
echo ""
echo "🔗 Useful links:"
echo "- Supabase Dashboard: https://supabase.com/dashboard"
echo "- Vapi.ai Dashboard: https://dashboard.vapi.ai/"

