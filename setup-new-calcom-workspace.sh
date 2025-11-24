#!/bin/bash

# Setup New Cal.com Workspace from Export
# This script creates a new Railway project and imports the exported variables

set -o pipefail

echo "🚀 Setting up new Cal.com workspace..."
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

# Find the most recent export directory
EXPORT_DIR=$(ls -td calcom-export-* 2>/dev/null | head -1)

if [ -z "$EXPORT_DIR" ]; then
    echo "❌ No export directory found!"
    echo "   Please run clone-calcom-environment.sh first, or specify export directory:"
    echo "   EXPORT_DIR=calcom-export-YYYYMMDD-HHMMSS ./setup-new-calcom-workspace.sh"
    exit 1
fi

echo "📁 Using export directory: $EXPORT_DIR"
echo ""

# Step 1: Create new Railway project
echo "🏗️  Step 1: Creating new Railway project..."
read -p "   Enter name for new project (default: calcom-app-new): " NEW_PROJECT_NAME
NEW_PROJECT_NAME=${NEW_PROJECT_NAME:-calcom-app-new}

echo "   Creating project: $NEW_PROJECT_NAME..."
if railway project create "$NEW_PROJECT_NAME" 2>/dev/null; then
    echo "   ✓ Project created successfully"
else
    echo "   ⚠ Project may already exist or error occurred"
fi

# Link to the new project
echo ""
echo "🔗 Linking to new project..."
echo "   Please select '$NEW_PROJECT_NAME' from the list:"
railway link

# Verify we're on the new project
echo ""
echo "🔍 Verifying new project..."
railway status
echo ""

# Confirm before proceeding
read -p "   Is this the correct project? (y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Aborted. Please link to the correct project and run again."
    exit 1
fi

# Step 2: Import variables
echo ""
echo "📤 Step 2: Importing environment variables..."
echo ""

if [ ! -f "$EXPORT_DIR/variables.kv" ]; then
    echo "❌ Error: variables.kv not found in $EXPORT_DIR"
    exit 1
fi

# Count variables to import
VAR_COUNT=$(grep -c "=" "$EXPORT_DIR/variables.kv" 2>/dev/null || echo "0")
echo "   Found $VAR_COUNT variables to import..."

# Import variables
IMPORTED=0
SKIPPED=0

while IFS= read -r line; do
    # Skip empty lines and comments
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    
    # Skip lines that don't have =
    [[ ! "$line" =~ = ]] && continue
    
    # Extract key and value
    key=$(echo "$line" | cut -d'=' -f1 | xargs)
    value=$(echo "$line" | cut -d'=' -f2- | xargs)
    
    # Skip if key is empty
    [[ -z "$key" ]] && continue
    
    # Skip Railway-specific internal variables that shouldn't be copied
    if [[ "$key" =~ ^(RAILWAY_|DATABASE_DIRECT_URL|DATABASE_HOST)$ ]]; then
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

echo ""
echo "✅ Imported $IMPORTED variables, skipped $SKIPPED"
echo ""

# Step 3: Deploy Cal.com
echo "🚀 Step 3: Deploying Cal.com..."
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
echo "   Deploying Cal.com Docker image..."
railway up --detach

# Restore original railway.json
rm railway.json
[ -f "railway.json.backup" ] && mv railway.json.backup railway.json

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Summary:"
echo "   - New project: $NEW_PROJECT_NAME"
echo "   - Variables imported: $IMPORTED"
echo "   - Deployment initiated"
echo ""
echo "🔍 Next steps:"
echo "   1. Check deployment status in Railway dashboard"
echo "   2. Update RAILWAY_PUBLIC_DOMAIN to match new project domain"
echo "   3. Verify all services are running"
echo ""

