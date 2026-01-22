#!/bin/bash

# Create a new Cal.com instance on Railway
# This clones the working configuration from CAPCO Design Group to a new project

set -o pipefail

echo "🚀 Creating new Cal.com instance on Railway..."
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

# Step 1: Create new Railway project
echo "🏗️  Step 1: Creating new Railway project..."
read -p "   Enter name for new Cal.com project (default: calcom-app-new): " NEW_PROJECT_NAME
NEW_PROJECT_NAME=${NEW_PROJECT_NAME:-calcom-app-new}

echo "   Creating project: $NEW_PROJECT_NAME..."
if railway init --name "$NEW_PROJECT_NAME" 2>/dev/null; then
    echo "   ✓ Project created successfully"
else
    echo "   ⚠ Project may already exist, or you need to create it manually"
    echo ""
    echo "   Please create the project manually:"
    echo "   1. Go to Railway dashboard: https://railway.app"
    echo "   2. Click '+ New Project'"
    echo "   3. Name it: $NEW_PROJECT_NAME"
    echo "   4. Then come back and run this script again"
    echo ""
    read -p "   Press Enter after creating the project, or 'q' to quit: " response
    if [ "$response" = "q" ] || [ "$response" = "Q" ]; then
        exit 1
    fi
    echo ""
    echo "🔗 Linking to new project..."
    echo "   Please select '$NEW_PROJECT_NAME' from the list:"
    railway link
fi

# Verify we're on the new project
echo ""
echo "🔍 Verifying new project..."
railway status
echo ""

# Auto-confirm if project name matches (or allow manual confirmation)
CURRENT_PROJECT=$(railway status 2>&1 | grep "Project:" | cut -d' ' -f2- | xargs)
if [[ "$CURRENT_PROJECT" == "$NEW_PROJECT_NAME" ]]; then
    echo "   ✓ Confirmed: Project matches '$NEW_PROJECT_NAME'"
    confirm="y"
else
    read -p "   Is this the correct project? (y/n): " confirm
    confirm=$(echo "$confirm" | tr '[:upper:]' '[:lower:]')
    if [ "$confirm" != "y" ]; then
        echo "❌ Aborted. Please link to the correct project and run again."
        exit 1
    fi
fi

# Step 2: Import variables from export (if available)
EXPORT_DIR=$(ls -td calcom-export-* 2>/dev/null | head -1)

if [ -n "$EXPORT_DIR" ] && [ -f "$EXPORT_DIR/variables.kv" ]; then
    echo ""
    echo "📤 Step 2: Importing environment variables from export..."
    echo "   Using: $EXPORT_DIR"
    
    IMPORTED=0
    SKIPPED=0
    
    while IFS= read -r line; do
        # Skip empty lines and comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        [[ ! "$line" =~ = ]] && continue
        
        # Extract key and value
        key=$(echo "$line" | cut -d'=' -f1 | xargs)
        value=$(echo "$line" | cut -d'=' -f2- | xargs)
        
        [[ -z "$key" ]] && continue
        
        # Skip Railway-specific internal variables that will be auto-generated
        if [[ "$key" =~ ^(RAILWAY_|DATABASE_DIRECT_URL|DATABASE_HOST|ALLOWED_HOSTNAMES)$ ]]; then
            ((SKIPPED++))
            continue
        fi
        
        # Set the variable
        if railway variables set "${key}=${value}" 2>/dev/null; then
            ((IMPORTED++))
            if [ $((IMPORTED % 5)) -eq 0 ]; then
                echo "   ✓ Imported $IMPORTED variables..."
            fi
        else
            ((SKIPPED++))
        fi
    done < "$EXPORT_DIR/variables.kv"
    
    echo "   ✅ Imported $IMPORTED variables, skipped $SKIPPED"
else
    echo ""
    echo "⚠️  No export directory found. You'll need to set environment variables manually."
    echo "   See CALCOM_DEPLOYMENT_FIX.md for required variables"
fi

# Step 3: Deploy Cal.com using railway-calcom.json
echo ""
echo "🚀 Step 3: Deploying Cal.com to new project..."
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
railway up --detach

# Restore original railway.json
rm railway.json
[ -f "railway.json.backup" ] && mv railway.json.backup railway.json

echo ""
echo "✅ New Cal.com instance deployment initiated!"
echo ""
echo "📋 Summary:"
echo "   - New project: $NEW_PROJECT_NAME"
if [ -n "$EXPORT_DIR" ]; then
    echo "   - Variables imported: $IMPORTED"
fi
echo "   - Deployment: Building from source (GitHub repo)"
echo ""
echo "🔍 Next steps:"
echo "   1. Check Railway dashboard for build progress"
echo "   2. Wait 10-15 minutes for build to complete"
echo "   3. Update RAILWAY_PUBLIC_DOMAIN to match new project domain"
echo "   4. Verify all environment variables are set correctly"
echo "   5. Test the new Cal.com instance"
echo ""
echo "💡 To watch build logs:"
echo "   railway logs --deploy"

