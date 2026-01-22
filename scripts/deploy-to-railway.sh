#!/bin/bash

echo "🚀 Deploying CAPCo Fire Protection to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Please run:"
    echo "railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Initialize Railway project if not already done
if [ ! -f ".railway/project.json" ]; then
    echo "🔧 Initializing Railway project..."
    railway init
fi

echo "📦 Building and deploying to Railway..."

# Update VAPI assistant configuration before deployment
echo "🤖 Updating VAPI assistant configuration..."
npm run update-vapi

railway up

echo "✅ Deployment complete!"
echo ""
echo "🔗 Your services will be available at:"
echo "   - Astro App: https://capco-fire-protection.railway.app"
echo "   - n8n: https://capco-fire-protection-n8n.railway.app"
echo ""
echo "📞 Update your Twilio webhook URL to:"
echo "   https://capco-fire-protection.railway.app/api/webhook-test/bde5f8fe-9f74-4310-a01e-cff3c843fcac"
