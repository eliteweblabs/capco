#!/bin/bash

# Update Cal.com deployment to use NIXPACKS build instead of Docker image
# This fixes the "image not found" error

echo "🔄 Updating Cal.com deployment configuration..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
if ! railway whoami &> /dev/null; then
    echo "🔐 Logging into Railway..."
    railway login
fi

# Link to Cal.com project
echo "🔗 Linking to Cal.com project..."
echo "   Please select 'CAPCO Design Group' from the list:"
railway link

# Verify we're on the correct project
echo ""
echo "🔍 Verifying project..."
CURRENT_PROJECT=$(railway status 2>&1 | grep "Project:" | cut -d' ' -f2-)
echo "   Current project: $CURRENT_PROJECT"

if [[ ! "$CURRENT_PROJECT" =~ "CAPCO Design Group" ]]; then
    echo "⚠️  Warning: Doesn't look like Cal.com project. Continue anyway? (y/n)"
    read -p "   " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "❌ Aborted."
        exit 1
    fi
fi

# Backup existing railway.json if it exists
if [ -f "railway.json" ]; then
    echo "💾 Backing up existing railway.json..."
    cp railway.json railway.json.backup-$(date +%Y%m%d-%H%M%S)
fi

# Use Cal.com config for deployment
echo "📋 Using railway-calcom.json configuration..."
if [ ! -f "railway-calcom.json" ]; then
    echo "❌ Error: railway-calcom.json not found!"
    exit 1
fi

cp railway-calcom.json railway.json

# Deploy
echo ""
echo "🚀 Deploying updated Cal.com configuration..."
echo "   This will trigger a new build using NIXPACKS (builds from source)"
echo "   This may take 10-15 minutes..."
echo ""
railway up --detach

# Restore original railway.json
echo ""
echo "🔄 Restoring original railway.json..."
rm railway.json
if [ -f "railway.json.backup"* ]; then
    LATEST_BACKUP=$(ls -t railway.json.backup-* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        mv "$LATEST_BACKUP" railway.json
        echo "   ✓ Restored from backup"
    fi
fi

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 What changed:"
echo "   - Switched from Docker image to NIXPACKS build"
echo "   - Now builds Cal.com from source (GitHub repo)"
echo "   - This fixes the 'image not found' error"
echo ""
echo "🔍 Next steps:"
echo "   1. Check Railway dashboard for build progress"
echo "   2. Monitor the build logs (it will take 10-15 minutes)"
echo "   3. Once deployed, verify Cal.com is working"
echo ""
echo "💡 Tip: You can watch the logs with:"
echo "   railway logs --deploy"

