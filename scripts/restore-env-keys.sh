#!/bin/bash

# Restore Complete Environment Variables
echo "🔧 Restoring complete .env file with all necessary keys..."

# Create a complete .env template
cat > .env << 'EOF'
# Supabase Database Configuration
PUBLIC_SUPABASE_URL=https://qudlxlryegnainztkrtk.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
PUBLIC_SUPABASE_URL=https://qudlxlryegnainztkrtk.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
PUBLIC_SUPABASE_ANON_KEY=your_SUPABASE_ANON_KEY_here

# Site Configuration
RAILWAY_PUBLIC_DOMAIN=http://localhost:4321

# Vapi.ai Configuration (fill in locally; do NOT commit real values)
VAPI_API_KEY=your_vapi_api_key_here
VAPI_WEBHOOK_SECRET=your_vapi_webhook_secret_here

# Cal.com Configuration
DATABASE_URL=https://qudlxlryegnainztkrtk.supabase.co
NEXTAUTH_SECRET=y2LFCKKxBysT3ixX1lPnqh4aKb6ehgD8iWw6dlCInrM=
CAL_WEBHOOK_SECRET=/CCHhXeOqe3CEGGPiyaP6z3vTZ0gSubTrNO336nJmfs=
POSTGRES_PASSWORD=CxO/OgBSceiXcc1STDfpCLJdPI5A7rpQfsM+GEDewP0=

# Google OAuth Configuration
GOOGLE_CONTACTS_CLIENT_ID=your_GOOGLE_CONTACTS_CLIENT_ID_here
GOOGLE_CONTACTS_CLIENT_SECRET=your_GOOGLE_CONTACTS_CLIENT_SECRET_here

# Email Configuration
EMAIL_SERVER_HOST=your_email_host_here
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_email_user_here
EMAIL_SERVER_PASSWORD=your_email_password_here
EMAIL_FROM=your_email_from_here

# Resend Email Service
RESEND_API_KEY=your_resend_api_key_here

# Plausible Analytics
PLAUSIBLE_API_TOKEN=your_plausible_api_token_here
PLAUSIBLE_URL=your_plausible_url_here
PLAUSIBLE_DB_PASSWORD=your_plausible_db_password_here
PLAUSIBLE_SECRET_KEY=your_plausible_secret_key_here
PLAUSIBLE_BASE_URL=your_plausible_base_url_here
PLAUSIBLE_MAILER_EMAIL=your_plausible_mailer_email_here
PLAUSIBLE_ADMIN_EMAIL=your_plausible_admin_email_here
PLAUSIBLE_ADMIN_PASSWORD=your_plausible_admin_password_here

# AI Agent Configuration
AI_AGENT_WEBHOOK_URL=your_ai_agent_webhook_url_here
AI_AGENT_API_KEY=your_ai_agent_api_key_here

# Cal.com API (if using external Cal.com)
CAL_API_KEY=your_cal_api_key_here
CAL_USERNAME=your_cal_username_here

# From Name for emails
FROM_NAME=your_from_name_here
EOF

echo "✅ Complete .env template created!"
echo ""
echo "📋 You need to fill in these placeholders with your actual keys:"
echo ""
echo "🔑 Supabase Keys (REQUIRED):"
echo "   - your_supabase_anon_key_here"
echo "   - your_SUPABASE_ANON_KEY_here"
echo ""
echo "🔑 Google OAuth (if using):"
echo "   - your_GOOGLE_CONTACTS_CLIENT_ID_here"
echo "   - your_GOOGLE_CONTACTS_CLIENT_SECRET_here"
echo ""
echo "🔑 Email Service (if using):"
echo "   - your_resend_api_key_here"
echo "   - your_email_host_here"
echo "   - your_email_user_here"
echo "   - your_email_password_here"
echo "   - your_email_from_here"
echo ""
echo "🔑 Analytics (if using):"
echo "   - your_plausible_api_token_here"
echo "   - your_plausible_url_here"
echo "   - (and other Plausible keys)"
echo ""
echo "🔑 AI Agent (if using):"
echo "   - your_ai_agent_webhook_url_here"
echo "   - your_ai_agent_api_key_here"
echo ""
echo "🔑 Cal.com (if using external):"
echo "   - your_cal_api_key_here"
echo "   - your_cal_username_here"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file and replace placeholders with your actual keys"
echo "2. Keep the keys you already have (VAPI_API_KEY, etc.)"
echo "3. Add the missing keys you need for your app"
echo "4. Test the system: curl -s http://localhost:4321/api/test-system | jq"
