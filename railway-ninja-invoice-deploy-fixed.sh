#!/bin/bash

# Fixed Ninja Invoice Railway Deployment Script
# This script handles the PHP extension issues

set -e

echo "🚀 Starting Fixed Ninja Invoice Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
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
railway new --name "ninja-invoice-fixed"

# Set environment variables
echo "🔧 Setting environment variables..."

# App configuration
railway variables:set APP_ENV=production
railway variables:set APP_DEBUG=false
railway variables:set APP_URL="https://ninja-invoice-fixed.railway.app"

# Database configuration
railway variables:set DB_CONNECTION=mysql

# Cache configuration
railway variables:set CACHE_DRIVER=redis
railway variables:set SESSION_DRIVER=redis
railway variables:set QUEUE_CONNECTION=redis

# PHP Extensions (this is the key fix)
railway variables:set PHP_EXTENSIONS="zip,bcmath,gd,mbstring,pdo_mysql,redis"

# Mail configuration
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

# Copy the nixpacks.toml file to the project
echo "📋 Copying Nixpacks configuration..."
cp nixpacks.toml ~/Desktop/invoiceninja/

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Add MySQL database service in Railway dashboard"
echo "2. Add Redis service in Railway dashboard"
echo "3. Wait for deployment to complete"
echo "4. Run database setup: railway run php artisan migrate"
echo "5. Create admin user: railway run php artisan ninja:create-user"
echo ""
echo "🔗 Railway Dashboard: https://railway.app/dashboard"
echo "📊 View logs: railway logs"
