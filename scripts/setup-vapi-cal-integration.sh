#!/bin/bash

# Vapi.ai + Cal.com Integration Setup Script
# This script sets up the complete integration between Vapi.ai and Cal.com

set -e

echo "🤖 Setting up Vapi.ai + Cal.com Integration..."

# Check if required environment variables are set
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Error: $1 environment variable is not set"
        echo "Please set it in your .env file or environment"
        exit 1
    fi
}

echo "🔍 Checking environment variables..."

# Required environment variables
check_env_var "VAPI_API_KEY"
check_env_var "CAL_API_KEY"
check_env_var "RAILWAY_PUBLIC_DOMAIN"
check_env_var "PUBLIC_SUPABASE_URL"
check_env_var "SUPABASE_ANON_KEY"

echo "✅ All required environment variables are set"

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Run database migration
echo "🗄️ Running database migration..."
if command -v psql &> /dev/null; then
    echo "Running SQL migration..."
    psql "$PUBLIC_SUPABASE_URL" -f sql-queriers/create-appointments-table.sql
    echo "✅ Database migration completed"
else
    echo "⚠️ psql not found. Please run the SQL migration manually:"
    echo "   psql \"$PUBLIC_SUPABASE_URL\" -f sql-queriers/create-appointments-table.sql"
fi

# Configure Vapi.ai assistant
echo "🤖 Configuring Vapi.ai assistant..."
node scripts/vapi-assistant-config.js

# Test the integration
echo "🧪 Testing integration..."

# Test Cal.com API connection
echo "Testing Cal.com API connection..."
CAL_TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $CAL_API_KEY" \
    "https://calcom-web-app-production-0b16.up.railway.app/api/users")

if [ "$CAL_TEST_RESPONSE" = "200" ]; then
    echo "✅ Cal.com API connection successful"
else
    echo "❌ Cal.com API connection failed (HTTP $CAL_TEST_RESPONSE)"
    echo "Please check your CAL_API_KEY and Cal.com instance"
fi

# Test Vapi.ai API connection
echo "Testing Vapi.ai API connection..."
VAPI_TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $VAPI_API_KEY" \
    "https://api.vapi.ai/assistant")

if [ "$VAPI_TEST_RESPONSE" = "200" ]; then
    echo "✅ Vapi.ai API connection successful"
else
    echo "❌ Vapi.ai API connection failed (HTTP $VAPI_TEST_RESPONSE)"
    echo "Please check your VAPI_API_KEY"
fi

# Test webhook endpoints
echo "Testing webhook endpoints..."
WEBHOOK_TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$RAILWAY_PUBLIC_DOMAIN/api/vapi/webhook")

if [ "$WEBHOOK_TEST_RESPONSE" = "405" ] || [ "$WEBHOOK_TEST_RESPONSE" = "200" ]; then
    echo "✅ Vapi.ai webhook endpoint is accessible"
else
    echo "❌ Vapi.ai webhook endpoint failed (HTTP $WEBHOOK_TEST_RESPONSE)"
fi

CAL_WEBHOOK_TEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$RAILWAY_PUBLIC_DOMAIN/api/cal/webhook")

if [ "$CAL_WEBHOOK_TEST_RESPONSE" = "405" ] || [ "$CAL_WEBHOOK_TEST_RESPONSE" = "200" ]; then
    echo "✅ Cal.com webhook endpoint is accessible"
else
    echo "❌ Cal.com webhook endpoint failed (HTTP $CAL_WEBHOOK_TEST_RESPONSE)"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Configure webhooks in your Cal.com instance:"
echo "   - Go to https://calcom-web-app-production-0b16.up.railway.app/settings/developer"
echo "   - Add webhook URL: $RAILWAY_PUBLIC_DOMAIN/api/cal/webhook"
echo "   - Select events: BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED, BOOKING_CONFIRMED"
echo ""
echo "2. Test the Vapi.ai assistant:"
echo "   - Use the assistant ID from the configuration output"
echo "   - Make a test call to verify everything works"
echo ""
echo "3. Configure your Cal.com API key:"
echo "   - Go to https://calcom-web-app-production-0b16.up.railway.app/settings/developer"
echo "   - Generate an API key and update your CAL_API_KEY"
echo ""
echo "4. Test the integration:"
echo "   - Create a test appointment in Cal.com"
echo "   - Verify it appears in your database"
echo "   - Test the Vapi.ai assistant with appointment queries"
echo ""
echo "🔗 Useful URLs:"
echo "   - Cal.com: https://calcom-web-app-production-0b16.up.railway.app/"
echo "   - Vapi.ai Dashboard: https://dashboard.vapi.ai/"
echo "   - Your webhook endpoints:"
echo "     - Vapi.ai: $RAILWAY_PUBLIC_DOMAIN/api/vapi/webhook"
echo "     - Cal.com: $RAILWAY_PUBLIC_DOMAIN/api/cal/webhook"
echo ""
echo "📚 Documentation:"
echo "   - Vapi.ai: https://docs.vapi.ai/"
echo "   - Cal.com API: https://cal.com/docs/api-reference"
echo ""
echo "✅ Integration setup complete!"
