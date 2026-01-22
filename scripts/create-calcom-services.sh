#!/bin/bash

# Create Cal.com services manually in Railway
# This script creates the database and app services, then deploys

echo "🚀 Creating Cal.com services in Railway..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Logging into Railway..."
    railway login
fi

# Verify we're linked to a project
echo "🔍 Checking current project..."
if ! railway status &> /dev/null; then
    echo "❌ No project linked!"
    echo "   Please link to your project first:"
    echo "   railway link"
    exit 1
fi

railway status
echo ""

# Step 1: Create PostgreSQL database service
echo "📦 Step 1: Creating PostgreSQL database service..."
railway add --database postgres --service calcom-db

echo ""
echo "⏳ Waiting for database to be created..."
sleep 3

# Step 2: Create Cal.com app service from GitHub repo
echo ""
echo "📦 Step 2: Creating Cal.com app service..."
railway add --repo calcom/cal.com --service calcom-app

echo ""
echo "⏳ Waiting for service to be created..."
sleep 3

echo ""
echo "✅ Services created!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to Railway dashboard and configure the services:"
echo "      - Set environment variables for 'calcom-app' service"
echo "      - Set CALCOM_DB_PASSWORD for 'calcom-db' service"
echo ""
echo "   2. Required environment variables for 'calcom-app':"
echo "      - CALCOM_DB_PASSWORD (same as database password)"
echo "      - CALCOM_NEXTAUTH_SECRET (generate: openssl rand -base64 32)"
echo "      - CALCOM_ENCRYPTION_KEY (generate: openssl rand -base64 32)"
echo "      - RESEND_API_KEY"
echo "      - EMAIL_FROM"
echo "      - EMAIL_FROM_NAME"
echo ""
echo "   3. After setting variables, trigger a deployment from the dashboard"
echo ""
echo "💡 Or continue with manual setup in Railway dashboard..."

