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
railway variables set PLAUSIBLE_MAILER_EMAIL="admin@capcofire.com"
railway variables set PLAUSIBLE_ADMIN_EMAIL="admin@capcofire.com"
railway variables set PLAUSIBLE_ADMIN_PASSWORD=$(openssl rand -base64 32)

echo "✅ Environment variables set!"
echo "🔐 Admin credentials:"
echo "   Email: admin@capcofire.com"
echo "   Password: Check Railway dashboard for PLAUSIBLE_ADMIN_PASSWORD"

# Deploy using the railway.json file
echo "🚀 Deploying to Railway..."
railway up --detach

echo "✅ Plausible Analytics deployed to Railway!"
echo "🌐 Access your analytics at: https://capco-plausible-analytics.railway.app"
echo "📊 Add your site (capcofire.com) in the Plausible dashboard"
echo "🔧 Update your app's PLAUSIBLE_URL to: https://capco-plausible-analytics.railway.app"
