#!/bin/bash

# Deploy Campfire Chat to Railway
echo "🚀 Deploying Campfire Chat to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create new project for Campfire
echo "🏗️  Creating Railway project for Campfire Chat..."
railway project create "capco-campfire-chat"

# Set environment variables
echo "🔧 Setting up environment variables..."
railway variables set CAMPFIRE_DB_PASSWORD=$(openssl rand -base64 32)
railway variables set CAMPFIRE_REDIS_PASSWORD=$(openssl rand -base64 32)
railway variables set CAMPFIRE_SECRET_KEY=$(openssl rand -base64 64)
railway variables set CAMPFIRE_BASE_URL="https://capco-campfire-chat.railway.app"
railway variables set CAMPFIRE_SMTP_HOST="smtp.resend.com"
railway variables set CAMPFIRE_SMTP_PORT="587"
railway variables set CAMPFIRE_SMTP_USER="resend"
railway variables set CAMPFIRE_SMTP_PASSWORD="your_resend_api_key_here"
railway variables set CAMPFIRE_FROM_EMAIL="noreply@capcofire.com"
railway variables set CAMPFIRE_DISABLE_REGISTRATION="true"
railway variables set CAMPFIRE_ADMIN_EMAIL="admin@capcofire.com"
railway variables set CAMPFIRE_ADMIN_PASSWORD=$(openssl rand -base64 32)

echo ""
echo "📱 Setting up VAPID keys for Web Push notifications..."
echo "⚠️  You need to generate VAPID keys manually:"
echo "   1. Visit https://vapidkeys.com"
echo "   2. Click 'Generate VAPID Keys'"
echo "   3. Copy the Public Key and Private Key"
echo "   4. Run these commands:"
echo "      railway variables set CAMPFIRE_VAPID_PUBLIC_KEY='your_public_key_here'"
echo "      railway variables set CAMPFIRE_VAPID_PRIVATE_KEY='your_private_key_here'"
echo ""
echo "   OR use command line:"
echo "      npm install -g web-push"
echo "      web-push generate-vapid-keys"

echo "✅ Environment variables set!"
echo "⚠️  IMPORTANT: Update these variables manually:"
echo "   - CAMPFIRE_SMTP_PASSWORD: Set your Resend API key"
echo "   - CAMPFIRE_ADMIN_PASSWORD: Note this value (shown above)"
echo ""
echo "🔐 Admin credentials:"
echo "   Email: admin@capcofire.com"
echo "   Password: Check Railway dashboard for CAMPFIRE_ADMIN_PASSWORD"

# Deploy using the railway.json file
echo "🚀 Deploying to Railway..."
railway up --detach

echo "✅ Campfire Chat deployed to Railway!"
echo "🌐 Access your chat at: https://capco-campfire-chat.railway.app"
echo "📊 After deployment:"
echo "   1. Login with admin credentials"
echo "   2. Configure your chat rooms and channels"
echo "   3. Get your API key from settings"
echo "   4. Add CAMPFIRE_URL and CAMPFIRE_API_KEY to your main app"

