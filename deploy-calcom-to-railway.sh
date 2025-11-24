#!/bin/bash

# Deploy Cal.com to Railway (separate project)
echo "🚀 Deploying Cal.com to Railway..."

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

# Create new project for Cal.com (separate from main project)
echo "🏗️  Creating Railway project for Cal.com..."
PROJECT_NAME=${CALCOM_PROJECT_NAME:-calcom-app}
echo "   Project name: $PROJECT_NAME"
echo "   (Set CALCOM_PROJECT_NAME env var to use a different name)"
railway project create "$PROJECT_NAME" 2>/dev/null || {
    echo "   Project may already exist, linking instead..."
    railway link
}

# Set environment variables
echo "🔧 Setting up environment variables..."
echo ""
echo "⚠️  IMPORTANT: Make sure these variables are set in Railway:"
echo "   - RESEND_API_KEY: Your Resend API key"
echo "   - EMAIL_FROM: Email address to send from (e.g., noreply@yourdomain.com)"
echo "   - EMAIL_FROM_NAME: Display name (e.g., Cal.com)"
echo "   - CALCOM_DB_PASSWORD: Database password"
echo "   - CALCOM_NEXTAUTH_SECRET: NextAuth secret (generate with: openssl rand -base64 32)"
echo "   - CALCOM_ENCRYPTION_KEY: Encryption key (generate with: openssl rand -base64 32)"
echo "   - RAILWAY_PUBLIC_DOMAIN: Your Railway domain (e.g., your-app.railway.app)"
echo ""
echo "   You can set them with:"
echo "   railway variables set RESEND_API_KEY=re_your_api_key_here"
echo "   railway variables set EMAIL_FROM=noreply@yourdomain.com"
echo "   railway variables set EMAIL_FROM_NAME=Cal.com"
echo ""

# Temporarily swap railway-calcom.json to railway.json for deployment
# (Railway CLI reads railway.json from current directory)
if [ -f "railway-calcom.json" ]; then
    echo "📋 Using railway-calcom.json configuration..."
    # Backup existing railway.json if it exists
    [ -f "railway.json" ] && mv railway.json railway.json.main-backup
    
    # Use Cal.com config for deployment
    cp railway-calcom.json railway.json
    
    # Deploy
    echo "🚀 Deploying Cal.com Docker image to Railway..."
    railway up --detach
    
    # Restore original railway.json
    rm railway.json
    [ -f "railway.json.main-backup" ] && mv railway.json.main-backup railway.json
    
    echo "✅ Restored original railway.json"
else
    echo "❌ Error: railway-calcom.json not found!"
    exit 1
fi

echo ""
echo "✅ Cal.com deployment initiated!"
echo "📧 Email configuration:"
echo "   - SMTP Server: smtp.resend.com:587"
echo "   - Make sure EMAIL_SERVER and related variables are set in Railway dashboard"
echo ""
echo "🔍 Check deployment status in Railway dashboard"
echo "📝 After deployment, verify email works by creating a test user"

