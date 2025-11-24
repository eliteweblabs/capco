#!/bin/bash

# Clone Cal.com Railway Environment to New Workspace
# This script exports the current Railway environment and deploys it to a new project

# Exit on error (but allow manual error handling)
set -o pipefail

echo "🔄 Cloning Cal.com Railway environment to new workspace..."
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

# Step 1: Export current environment
echo "📥 Step 1: Exporting current Railway environment..."
echo ""

# Check if project is linked
if ! railway status &> /dev/null; then
    echo "⚠️  No project linked. Please link to your current Cal.com project:"
    railway link
fi

# Create export directory
EXPORT_DIR="calcom-export-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$EXPORT_DIR"
echo "📁 Export directory: $EXPORT_DIR"

# Export variables
echo "📝 Exporting environment variables..."
railway variables --json > "$EXPORT_DIR/variables.json" 2>&1
railway variables --kv > "$EXPORT_DIR/variables.kv" 2>&1
railway status > "$EXPORT_DIR/project-status.txt" 2>&1

echo "✅ Variables exported to $EXPORT_DIR/"
echo ""

# Step 2: Create new Railway project
echo "🏗️  Step 2: Creating new Railway project..."
read -p "   Enter name for new project (default: calcom-app-new): " NEW_PROJECT_NAME
NEW_PROJECT_NAME=${NEW_PROJECT_NAME:-calcom-app-new}

echo "   Creating project: $NEW_PROJECT_NAME..."
if railway project create "$NEW_PROJECT_NAME" 2>/dev/null; then
    echo "   ✓ Project created successfully"
    # Automatically link to the new project
    railway link
else
    echo "   Project may already exist. Please link manually:"
    railway link
    read -p "   Press Enter after linking to the new project..."
fi

# Verify we're on the new project
echo ""
echo "🔍 Verifying new project..."
railway status
echo ""

# Step 3: Import variables to new project
echo "📤 Step 3: Importing environment variables to new project..."
echo ""

if [ ! -f "$EXPORT_DIR/variables.kv" ]; then
    echo "❌ Error: variables.kv not found in export directory"
    exit 1
fi

# Count variables to import
VAR_COUNT=$(grep -c "=" "$EXPORT_DIR/variables.kv" || echo "0")
echo "   Found $VAR_COUNT variables to import..."

# Import variables (skip empty lines and comments)
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
    
    # Set the variable (Railway CLI syntax: railway variables set KEY=VALUE)
    # Handle values that may contain special characters
    if railway variables set "${key}=${value}" 2>/dev/null; then
        ((IMPORTED++))
        echo "   ✓ $key"
    else
        # Try alternative syntax
        if echo "${value}" | railway variables set "${key}" 2>/dev/null; then
            ((IMPORTED++))
            echo "   ✓ $key (via stdin)"
        else
            ((SKIPPED++))
            echo "   ⚠ Skipped: $key (may need manual setup or contains special chars)"
        fi
    fi
done < "$EXPORT_DIR/variables.kv"

echo ""
echo "✅ Imported $IMPORTED variables, skipped $SKIPPED"
echo ""

# If many variables were skipped, offer manual import option
if [ "$SKIPPED" -gt 0 ]; then
    echo "⚠️  Some variables were skipped. You can import them manually:"
    echo "   railway variables set KEY=VALUE"
    echo ""
    echo "   Or use the export file: $EXPORT_DIR/variables.kv"
    echo "   Review and set variables manually in Railway dashboard if needed"
    echo ""
fi

# Step 4: Deploy using railway-calcom.json
echo "🚀 Step 4: Deploying Cal.com to new project..."
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
echo "✅ Deployment initiated!"
echo ""
echo "📋 Summary:"
echo "   - Original environment exported to: $EXPORT_DIR/"
echo "   - New project: $NEW_PROJECT_NAME"
echo "   - Variables imported: $IMPORTED"
echo ""
echo "🔍 Next steps:"
echo "   1. Check deployment status in Railway dashboard"
echo "   2. Verify all environment variables are set correctly"
echo "   3. Update RAILWAY_PUBLIC_DOMAIN if needed"
echo "   4. Test the new Cal.com installation"
echo ""
echo "⚠️  SECURITY: The export directory contains sensitive credentials!"
echo "   Keep it secure and delete when no longer needed: rm -rf $EXPORT_DIR"

