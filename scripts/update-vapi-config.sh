#!/bin/bash

# VAPI Assistant Configuration Update Script
# This script updates the VAPI assistant configuration

echo "🤖 Updating VAPI assistant configuration..."

# Check if required environment variables are set
if [ -z "$VAPI_API_KEY" ]; then
    echo "❌ Error: VAPI_API_KEY environment variable is not set"
    echo "Please set it in your .env file or environment"
    exit 1
fi

if [ -z "$SITE_URL" ]; then
    echo "❌ Error: SITE_URL environment variable is not set"
    echo "Please set it in your .env file or environment"
    exit 1
fi

echo "✅ Environment variables are set"

# Run the VAPI assistant configuration
echo "🔄 Updating VAPI assistant..."
node scripts/vapi-assistant-config.js

echo "✅ VAPI assistant configuration updated!"
echo ""
echo "🎯 Your VAPI assistant is now updated with the latest configuration."
echo "   The assistant will use the new settings for all future calls."
