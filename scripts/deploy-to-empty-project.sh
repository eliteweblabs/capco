#!/bin/bash

# Deploy Cal.com to currently linked Railway project
# Make sure you've linked to your empty project first: railway link

echo "🚀 Deploying Cal.com to current Railway project..."
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

# Step 1: Deploy Cal.com first (this creates the services)
echo "🚀 Step 1: Deploying Cal.com (this creates the services)..."
echo ""

if [ ! -f "railway-calcom.json" ]; then
    echo "❌ Error: railway-calcom.json not found!"
    exit 1
fi

# Backup existing railway.json if it exists
[ -f "railway.json" ] && mv railway.json railway.json.backup

# Use Cal.com config for deployment
cp railway-calcom.json railway.json

# Deploy
echo "   Deploying Cal.com (building from source - this will take 10-15 minutes)..."
echo "   This may take a moment to start..."
railway up --detach 2>&1
echo ""
echo "   ⏳ Deployment initiated. Waiting a moment for services to be created..."

# Wait a bit for services to be created
sleep 5

# Restore original railway.json
rm railway.json
[ -f "railway.json.backup" ] && mv railway.json.backup railway.json

echo ""
echo "✅ Cal.com deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "   1. Check Railway dashboard for build progress"
echo "   2. Wait 10-15 minutes for build to complete"
echo "   3. After services are created, you can set additional environment variables:"
echo ""
echo "   The railway-calcom.json already includes essential variables."
echo "   After deployment, you may want to set these in Railway dashboard:"
echo "   - CALCOM_DB_PASSWORD (if not already set)"
echo "   - CALCOM_NEXTAUTH_SECRET (if not already set)"
echo "   - CALCOM_ENCRYPTION_KEY (if not already set)"
echo "   - RESEND_API_KEY"
echo "   - EMAIL_FROM"
echo "   - EMAIL_FROM_NAME"
echo ""
echo "   RAILWAY_PUBLIC_DOMAIN will be auto-generated after deployment."
echo ""
echo "💡 To watch build logs:"
echo "   railway logs --deploy"

