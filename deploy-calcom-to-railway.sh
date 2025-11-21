#!/bin/bash

# Deploy Cal.com to Railway
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

# Check if we're in a Cal.com project or need to create/link one
echo "🔗 Linking to Cal.com Railway project..."
echo "   (If you don't have a Cal.com project yet, create one in Railway dashboard first)"
railway link

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

# Temporarily rename railway-calcom.json to railway.json for deployment
if [ -f "railway-calcom.json" ]; then
    echo "📋 Using railway-calcom.json configuration..."
    cp railway-calcom.json railway.json.tmp
    mv railway.json railway.json.backup 2>/dev/null || true
    mv railway.json.tmp railway.json
fi

# Deploy
echo "🚀 Deploying to Railway..."
railway up --detach

# Restore original railway.json if it existed
if [ -f "railway.json.backup" ]; then
    mv railway.json.backup railway.json
    rm -f railway.json.tmp
elif [ -f "railway.json" ]; then
    # If there was no backup, check if we should keep or remove
    if grep -q "calcom-web-app" railway.json 2>/dev/null; then
        echo "⚠️  Note: railway.json now contains Cal.com config. Restore from railway-calcom.json if needed."
    fi
fi

echo ""
echo "✅ Cal.com deployment initiated!"
echo "📧 Email configuration:"
echo "   - SMTP Server: smtp.resend.com:587"
echo "   - Make sure EMAIL_SERVER and related variables are set in Railway dashboard"
echo ""
echo "🔍 Check deployment status in Railway dashboard"
echo "📝 After deployment, verify email works by creating a test user"

