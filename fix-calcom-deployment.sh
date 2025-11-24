#!/bin/bash

# Fix Cal.com deployment by creating services and configuring to build from source
# This bypasses the broken Railway template and Docker image issues

echo "🔧 Setting up Cal.com with build-from-source configuration..."
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

PROJECT_INFO=$(railway status 2>&1)
echo "$PROJECT_INFO"
echo ""

echo "📋 Manual Setup Instructions:"
echo ""
echo "Since Railway template is broken, follow these steps in Railway Dashboard:"
echo ""
echo "STEP 1: Create PostgreSQL Database"
echo "  1. Railway Dashboard → Your Project → '+ New' → 'Database' → 'PostgreSQL'"
echo "  2. Name it: calcom-db"
echo "  3. Note the DATABASE_URL from the Variables tab"
echo ""
echo "STEP 2: Create Empty Service for Cal.com"
echo "  1. Railway Dashboard → '+ New' → 'Empty Service'"
echo "  2. Name it: calcom-app"
echo ""
echo "STEP 3: Configure Cal.com Service Source"
echo "  1. Click on 'calcom-app' service"
echo "  2. Go to 'Settings' tab"
echo "  3. Under 'Source', you have two options:"
echo ""
echo "     OPTION A: Connect GitHub (if you can access calcom/cal.com)"
echo "     - Click 'Connect GitHub'"
echo "     - Search for: calcom/cal.com"
echo "     - Branch: main"
echo "     - Build Command: (leave empty - Railway auto-detects)"
echo "     - Start Command: npm run start"
echo ""
echo "     OPTION B: Use NIXPACKS with GitHub URL (if GitHub search fails)"
echo "     - In Settings → Source → Change to 'GitHub Repo'"
echo "     - Repository: https://github.com/calcom/cal.com"
echo "     - Branch: main"
echo ""
echo "STEP 4: Set Environment Variables"
echo "  Go to 'calcom-app' service → 'Variables' tab and add:"
echo ""

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

cat << EOF
  Required Variables:
  
  Database:
  - DATABASE_URL = (get from calcom-db service → Variables → DATABASE_URL)
  - CALCOM_DB_PASSWORD = (get from calcom-db service → Variables → POSTGRES_PASSWORD)
  
  Cal.com Secrets:
  - NEXTAUTH_SECRET = $NEXTAUTH_SECRET
  - CALENDSO_ENCRYPTION_KEY = $ENCRYPTION_KEY
  
  URLs (set after deployment, Railway will generate domain):
  - NEXTAUTH_URL = https://\${{RAILWAY_PUBLIC_DOMAIN}}
  - NEXT_PUBLIC_WEBAPP_URL = https://\${{RAILWAY_PUBLIC_DOMAIN}}
  - NEXT_PUBLIC_WEBSITE_URL = https://\${{RAILWAY_PUBLIC_DOMAIN}}
  
  Email (Resend):
  - RESEND_API_KEY = (your Resend API key)
  - EMAIL_SERVER = smtp://resend:\${{RESEND_API_KEY}}@smtp.resend.com:587
  - EMAIL_SERVER_HOST = smtp.resend.com
  - EMAIL_SERVER_PORT = 587
  - EMAIL_SERVER_USER = resend
  - EMAIL_SERVER_PASSWORD = \${{RESEND_API_KEY}}
  - EMAIL_FROM = (your email, e.g., app@yourdomain.com)
  - EMAIL_FROM_NAME = (display name, e.g., Cal.com)
  
  Other:
  - NODE_ENV = production
  - PORT = 3000

EOF

echo ""
echo "STEP 5: Deploy"
echo "  After setting variables, Railway will auto-deploy"
echo "  Or click 'Deploy' button manually"
echo "  Build will take 10-15 minutes (building from source)"
echo ""
echo "💡 TIP: If GitHub repo search fails, try:"
echo "   1. Fork calcom/cal.com to your GitHub account"
echo "   2. Then connect your fork instead"
echo ""
echo "📝 Generated secrets saved above - copy them when setting variables!"

