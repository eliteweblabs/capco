#!/bin/bash

# Environment Variables Setup for Vapi.ai + Cal.com Integration
# This script helps you set up the required environment variables

echo "🔧 Setting up environment variables for Vapi.ai + Cal.com integration..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one first."
    exit 1
fi

echo ""
echo "📝 You need to add the following environment variables to your .env file:"
echo ""

# Vapi.ai API Key
if [ -z "$VAPI_API_KEY" ]; then
    echo "VAPI_API_KEY=your_vapi_api_key_here"
    echo "# Get this from https://dashboard.vapi.ai/"
else
    echo "✅ VAPI_API_KEY is already set"
fi

# Cal.com API Key  
if [ -z "$CAL_API_KEY" ]; then
    echo "CAL_API_KEY=your_cal_api_key_here"
    echo "# Get this from your Cal.com instance settings"
else
    echo "✅ CAL_API_KEY is already set"
fi

# Webhook Secret
if [ -z "$VAPI_WEBHOOK_SECRET" ]; then
    echo "VAPI_WEBHOOK_SECRET=$(openssl rand -base64 32)"
    echo "# Generated webhook secret"
else
    echo "✅ VAPI_WEBHOOK_SECRET is already set"
fi

# Site URL
if [ -z "$SITE_URL" ]; then
    echo "SITE_URL=http://localhost:4321"
    echo "# Your site URL (change for production)"
else
    echo "✅ SITE_URL is already set: $SITE_URL"
fi

echo ""
echo "📋 Next steps:"
echo "1. Add the missing environment variables to your .env file"
echo "2. Get your Vapi.ai API key from https://dashboard.vapi.ai/"
echo "3. Get your Cal.com API key from your Cal.com instance"
echo "4. Run the test again: node scripts/test-vapi-cal-integration.js"
echo ""
echo "🔗 Useful links:"
echo "- Vapi.ai Dashboard: https://dashboard.vapi.ai/"
echo "- Your Cal.com instance: https://calcom-web-app-production-0b16.up.railway.app/"
echo "- Vapi.ai Documentation: https://docs.vapi.ai/"
