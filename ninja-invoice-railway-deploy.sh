#!/bin/bash

# Ninja Invoice Railway Deployment Script
# This script automates the deployment of Ninja Invoice to Railway

set -e

echo "🚀 Starting Ninja Invoice Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   or visit: https://railway.app/docs"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI found and user logged in"

# Create new Railway project
echo "📦 Creating Railway project..."
railway new --name "ninja-invoice-production"

# Set environment variables
echo "🔧 Setting environment variables..."

# App configuration
railway variables:set APP_ENV=production
railway variables:set APP_DEBUG=false
railway variables:set APP_URL="https://ninja-invoice-production.railway.app"

# Database configuration (Railway will auto-configure these)
railway variables:set DB_CONNECTION=mysql

# Cache configuration
railway variables:set CACHE_DRIVER=redis
railway variables:set SESSION_DRIVER=redis
railway variables:set QUEUE_CONNECTION=redis

# Mail configuration (update with your SMTP settings)
railway variables:set MAIL_MAILER=smtp
railway variables:set MAIL_HOST="smtp.gmail.com"
railway variables:set MAIL_PORT=587
railway variables:set MAIL_USERNAME="your-email@gmail.com"
railway variables:set MAIL_PASSWORD="your-app-password"
railway variables:set MAIL_FROM_ADDRESS="noreply@your-domain.com"
railway variables:set MAIL_FROM_NAME="Ninja Invoice"

# API configuration
railway variables:set API_SECRET="$(openssl rand -base64 32)"

echo "✅ Environment variables set"

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

# Wait for deployment to complete
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
railway run php artisan migrate --force

# Clear and cache configuration
echo "🧹 Clearing and caching configuration..."
railway run php artisan config:clear
railway run php artisan config:cache
railway run php artisan route:cache
railway run php artisan view:cache

# Create admin user
echo "👤 Creating admin user..."
echo "You'll need to create an admin user manually:"
echo "railway run php artisan ninja:create-user"

# Get the deployment URL
echo "🌐 Getting deployment URL..."
DEPLOYMENT_URL=$(railway domain)

echo "✅ Deployment complete!"
echo ""
echo "🎉 Ninja Invoice is now deployed at: $DEPLOYMENT_URL"
echo ""
echo "📋 Next steps:"
echo "1. Create admin user: railway run php artisan ninja:create-user"
echo "2. Update your main project's .env with:"
echo "   NINJA_INVOICE_URL=$DEPLOYMENT_URL"
echo "   NINJA_INVOICE_API_URL=$DEPLOYMENT_URL/api"
echo "   NINJA_INVOICE_API_KEY=your-api-key-from-ninja-invoice"
echo ""
echo "3. Test the integration at: /ninja-invoice-demo"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"
echo "📊 View logs: railway logs"
echo "🔧 Connect to service: railway connect"
