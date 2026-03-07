#!/bin/bash

# Deploy Plausible Analytics to Railway
echo "🚀 Deploying Plausible Analytics to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create new project for Plausible
echo "🏗️  Creating Railway project for Plausible Analytics..."
railway project create "capco-plausible-analytics"

# Set environment variables
echo "🔧 Setting up environment variables..."
railway variables set PLAUSIBLE_DB_PASSWORD=$(openssl rand -base64 32)
railway variables set PLAUSIBLE_SECRET_KEY=$(openssl rand -base64 64)
railway variables set PLAUSIBLE_BASE_URL="https://capco-plausible-analytics.railway.app"
railway variables set PLAUSIBLE_MAILER_EMAIL="noreply@$RAILWAY_PUBLIC_DOMAIN"
railway variables set PLAUSIBLE_ADMIN_EMAIL="admin@$RAILWAY_PUBLIC_DOMAIN"
railway variables set PLAUSIBLE_ADMIN_PASSWORD=$(openssl rand -base64 32)

echo ""
echo "⚠️  IMPORTANT: Make sure to set RESEND_API_KEY if not already set:"
echo "   railway variables set RESEND_API_KEY=re_your_api_key_here"
echo "   (The configuration uses Resend SMTP at smtp.resend.com:587)"

echo "✅ Environment variables set!"
echo "🔐 Admin credentials:"
echo "   Email: admin@$RAILWAY_PUBLIC_DOMAIN"
echo "   Password: Check Railway dashboard for PLAUSIBLE_ADMIN_PASSWORD"

# Deploy using the railway.json file
echo "🚀 Deploying to Railway..."
railway up --detach

echo "✅ Plausible Analytics deployed to Railway!"
echo "🌐 Access your analytics at: https://capco-plausible-analytics.railway.app"
echo "📊 Add your site ($RAILWAY_PUBLIC_DOMAIN) in the Plausible dashboard"
echo "🔧 Update your app's PLAUSIBLE_URL to: https://capco-plausible-analytics.railway.app"
