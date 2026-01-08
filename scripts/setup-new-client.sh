#!/bin/bash

# =============================================================================
# SETUP NEW CLIENT SCRIPT
# =============================================================================
# This script helps you set up a new client deployment on Railway
# It prompts for all required environment variables and creates a config file
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "   SETUP NEW CLIENT DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""

# Get client identifier
read -p "Enter client identifier (e.g., 'acme-fire'): " CLIENT_ID
if [ -z "$CLIENT_ID" ]; then
  echo -e "${RED}Error: Client ID is required${NC}"
  exit 1
fi

CONFIG_FILE="configs/${CLIENT_ID}.env"
mkdir -p configs

# Check if config already exists
if [ -f "$CONFIG_FILE" ]; then
  echo -e "${YELLOW}⚠️  Config file already exists: $CONFIG_FILE${NC}"
  read -p "Overwrite? (y/N): " OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 0
  fi
fi

echo ""
echo -e "${BLUE}Company Information${NC}"
echo "─────────────────────────────────────────────────────────"

read -p "Company Name: " COMPANY_NAME
read -p "Company Slogan: " COMPANY_SLOGAN
read -p "Company Address: " COMPANY_ADDRESS
read -p "Company Phone (with country code, e.g., +15551234567): " COMPANY_PHONE
read -p "Company Email: " COMPANY_EMAIL
read -p "Railway Domain (e.g., acme-fire.railway.app): " RAILWAY_DOMAIN

echo ""
echo -e "${BLUE}Brand Colors${NC}"
echo "─────────────────────────────────────────────────────────"

read -p "Primary Color (hex, e.g., #825BDD): " PRIMARY_COLOR
read -p "Secondary Color (hex, e.g., #0ea5e9): " SECONDARY_COLOR

echo ""
echo -e "${BLUE}Logos${NC}"
echo "─────────────────────────────────────────────────────────"
echo "You can provide SVG markup or a file path"
echo "Leave empty to use text logo (company name)"
read -p "Company Logo SVG (or path like /img/logo.svg): " LOGO_SVG
read -p "Company Icon SVG (or path like /img/icon.svg): " ICON_SVG

echo ""
echo -e "${BLUE}Supabase Configuration${NC}"
echo "─────────────────────────────────────────────────────────"

read -p "Supabase URL: " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Admin Key: " SUPABASE_ADMIN_KEY
read -p "Supabase Publishable Key: " SUPABASE_PUBLISHABLE_KEY
read -p "Supabase Secret: " SUPABASE_SECRET

echo ""
echo -e "${BLUE}Email Configuration${NC}"
echo "─────────────────────────────────────────────────────────"

read -p "Email Provider (resend/mailgun): " EMAIL_PROVIDER
read -p "Email API Key: " EMAIL_API_KEY
read -p "From Email: " FROM_EMAIL
read -p "From Name: " FROM_NAME

echo ""
echo -e "${BLUE}VAPI Configuration${NC}"
echo "─────────────────────────────────────────────────────────"

read -p "VAPI Phone Number: " VAPI_PHONE

# Generate config file
cat > "$CONFIG_FILE" << EOF
# =============================================================================
# CLIENT CONFIGURATION: ${CLIENT_ID}
# Generated: $(date)
# =============================================================================

# Company Identity
RAILWAY_PROJECT_NAME="${COMPANY_NAME}"
GLOBAL_COMPANY_SLOGAN="${COMPANY_SLOGAN}"
GLOBAL_COMPANY_ADDRESS="${COMPANY_ADDRESS}"
GLOBAL_COMPANY_PHONE="${COMPANY_PHONE}"
GLOBAL_COMPANY_EMAIL="${COMPANY_EMAIL}"
RAILWAY_PUBLIC_DOMAIN="${RAILWAY_DOMAIN}"
YEAR="$(date +%Y)"

# Brand Colors
GLOBAL_COLOR_PRIMARY="${PRIMARY_COLOR}"
GLOBAL_COLOR_SECONDARY="${SECONDARY_COLOR}"

# Logos
GLOBAL_COMPANY_LOGO_SVG="${LOGO_SVG}"
GLOBAL_COMPANY_ICON_SVG="${ICON_SVG}"

# Typography (defaults)
FONT_FAMILY="Outfit Variable"
FONT_FAMILY_FALLBACK="sans-serif"

# Supabase
PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_ADMIN_KEY="${SUPABASE_ADMIN_KEY}"
PUBLIC_SUPABASE_PUBLISHABLE="${SUPABASE_PUBLISHABLE_KEY}"
SUPABASE_SECRET="${SUPABASE_SECRET}"

# Email
EMAIL_PROVIDER="${EMAIL_PROVIDER}"
EMAIL_API_KEY="${EMAIL_API_KEY}"
FROM_EMAIL="${FROM_EMAIL}"
FROM_NAME="${FROM_NAME}"

# VAPI
VAPI_PHONE_NUMBER="${VAPI_PHONE}"

# Railway
NODE_ENV="production"
PORT="3000"
EOF

echo ""
echo -e "${GREEN}✅ Configuration file created: $CONFIG_FILE${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review the config file: ${YELLOW}cat $CONFIG_FILE${NC}"
echo "2. Create Railway project: ${YELLOW}railway init${NC}"
echo "3. Link to project: ${YELLOW}railway link${NC}"
echo "4. Set environment variables: ${YELLOW}railway variables set < $(cat $CONFIG_FILE | grep -v '^#' | grep -v '^$')${NC}"
echo "   Or use: ${YELLOW}railway variables set RAILWAY_PROJECT_NAME=\"${COMPANY_NAME}\"${NC}"
echo "5. Deploy: ${YELLOW}railway up${NC}"
echo ""
echo -e "${GREEN}Or use the deploy script:${NC}"
echo "  ${YELLOW}./scripts/deploy-client.sh ${CLIENT_ID}${NC}"

