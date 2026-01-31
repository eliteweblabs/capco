#!/bin/bash

# OTP Authentication Setup Verification Script
# This script verifies that OTP authentication is properly configured

echo "🔐 OTP Authentication Setup Verification"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check required environment variables
echo "📋 Checking environment variables..."

check_env_var() {
    local var_name=$1
    local var_value=$(grep "^$var_name=" .env | cut -d '=' -f 2)
    
    if [ -z "$var_value" ]; then
        echo "❌ $var_name is not set"
        return 1
    else
        echo "✅ $var_name is configured"
        return 0
    fi
}

# Check Supabase configuration
check_env_var "PUBLIC_SUPABASE_URL"
check_env_var "PUBLIC_SUPABASE_ANON_KEY"

# Check Email Provider configuration
check_env_var "EMAIL_PROVIDER"
check_env_var "EMAIL_API_KEY"
check_env_var "FROM_EMAIL"

echo ""
echo "📁 Checking required files..."

# Check if API routes exist
check_file() {
    local file_path=$1
    local file_name=$2
    
    if [ -f "$file_path" ]; then
        echo "✅ $file_name exists"
        return 0
    else
        echo "❌ $file_name not found at $file_path"
        return 1
    fi
}

check_file "src/pages/api/auth/send-otp.ts" "Send OTP API route"
check_file "src/pages/api/auth/verify-otp.ts" "Verify OTP API route"
check_file "src/components/form/OTPForm.astro" "OTP Form component"
check_file "src/pages/auth/otp-login.astro" "OTP Login page"

echo ""
echo "🔍 Checking Supabase configuration..."

# Check if we can reach Supabase
SUPABASE_URL=$(grep "^PUBLIC_SUPABASE_URL=" .env | cut -d '=' -f 2)

if [ ! -z "$SUPABASE_URL" ]; then
    echo "Testing connection to $SUPABASE_URL..."
    if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL" | grep -q "200\|404"; then
        echo "✅ Supabase URL is reachable"
    else
        echo "⚠️  Warning: Could not reach Supabase URL (this might be normal if behind firewall)"
    fi
fi

echo ""
echo "📝 Setup Summary"
echo "================"
echo ""
echo "OTP authentication routes:"
echo "  - POST /api/auth/send-otp"
echo "  - POST /api/auth/verify-otp"
echo ""
echo "OTP login page:"
echo "  - /auth/otp-login"
echo ""
echo "Integration points:"
echo "  - Login page (/auth/login) includes OTP link"
echo ""
echo "✅ OTP Authentication setup verification complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Configure email templates in Supabase Dashboard"
echo "     (Authentication > Email Templates > Magic Link)"
echo "  2. Test OTP flow at /auth/otp-login"
echo "  3. Check email delivery in your inbox"
echo ""
echo "📖 For more information, see:"
echo "  - markdowns/otp-authentication-setup.md"
echo "  - https://supabase.com/docs/guides/auth/auth-otp"
