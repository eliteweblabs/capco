#!/bin/bash

# =============================================================================
# INTERACTIVE CLIENT SETUP SCRIPT
# =============================================================================
# This script interactively gathers client information and generates
# a complete .env file ready for deployment
#
# Usage: ./scripts/setup-client.sh [client-name]
#
# Example: ./scripts/setup-client.sh acme-fire
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "   FIRE PROTECTION SYSTEM - CLIENT SETUP"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

# Get client name
if [ -z "$1" ]; then
  echo -e "${YELLOW}Enter client identifier (lowercase, no spaces, e.g., 'acme-fire'):${NC}"
  read -r CLIENT_ID
else
  CLIENT_ID=$1
fi

# Validate client ID
if [[ ! "$CLIENT_ID" =~ ^[a-z0-9-]+$ ]]; then
  echo -e "${RED}Error: Client ID must be lowercase alphanumeric with hyphens only${NC}"
  exit 1
fi

echo -e "${GREEN}Setting up client: $CLIENT_ID${NC}"
echo ""

# Create configs directory if it doesn't exist
mkdir -p configs

ENV_FILE="configs/${CLIENT_ID}.env"

# Check if file already exists
if [ -f "$ENV_FILE" ]; then
  echo -e "${YELLOW}Warning: $ENV_FILE already exists${NC}"
  echo -e "${YELLOW}Do you want to overwrite it? (y/N):${NC}"
  read -r OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
  fi
fi

# =============================================================================
# GATHER INFORMATION
# =============================================================================

echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}COMPANY BRANDING${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -e "${YELLOW}Company Name (e.g., 'Acme Fire Protection'):${NC}"
read -r COMPANY_NAME

echo -e "${YELLOW}Company Slogan:${NC}"
read -r COMPANY_SLOGAN
COMPANY_SLOGAN=${COMPANY_SLOGAN:-"Professional Fire Protection Services"}

echo -e "${YELLOW}Company Address:${NC}"
read -r COMPANY_ADDRESS

echo -e "${YELLOW}Company Phone (with country code, e.g., +15551234567):${NC}"
read -r COMPANY_PHONE

echo -e "${YELLOW}Company Email:${NC}"
read -r COMPANY_EMAIL

echo -e "${YELLOW}Primary Brand Color (hex, e.g., #825BDD):${NC}"
read -r PRIMARY_COLOR
PRIMARY_COLOR=${PRIMARY_COLOR:-"#825BDD"}

echo -e "${YELLOW}Secondary Brand Color (hex, e.g., #0ea5e9):${NC}"
read -r SECONDARY_COLOR
SECONDARY_COLOR=${SECONDARY_COLOR:-"#0ea5e9"}

echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}SUPABASE CONFIGURATION${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -e "${YELLOW}Supabase URL (from Supabase dashboard):${NC}"
read -r SUPABASE_URL

echo -e "${YELLOW}Supabase Anon Key:${NC}"
read -r SUPABASE_ANON_KEY

echo -e "${YELLOW}Supabase Service Role Key:${NC}"
read -r SUPABASE_SERVICE_KEY

echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}VAPI VOICE ASSISTANT${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -e "${YELLOW}Do you want to configure VAPI? (y/N):${NC}"
read -r CONFIGURE_VAPI

if [[ "$CONFIGURE_VAPI" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}VAPI API Key:${NC}"
  read -r VAPI_API_KEY

  echo -e "${YELLOW}VAPI Phone Number:${NC}"
  read -r VAPI_PHONE

  echo -e "${YELLOW}VAPI Assistant ID:${NC}"
  read -r PUBLIC_VAPI_ASSISTANT_ID
else
  VAPI_API_KEY=""
  VAPI_PHONE=""
  PUBLIC_VAPI_ASSISTANT_ID=""
fi

echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}STRIPE PAYMENTS${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -e "${YELLOW}Do you want to configure Stripe? (y/N):${NC}"
read -r CONFIGURE_STRIPE

if [[ "$CONFIGURE_STRIPE" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Stripe Publishable Key:${NC}"
  read -r STRIPE_PUB_KEY

  echo -e "${YELLOW}Stripe Secret Key:${NC}"
  read -r STRIPE_SECRET_KEY
else
  STRIPE_PUB_KEY=""
  STRIPE_SECRET_KEY=""
fi

echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}RESEND EMAIL${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -e "${YELLOW}Resend API Key:${NC}"
read -r RESEND_API_KEY

echo -e "${YELLOW}Email From Address (e.g., noreply@example.com):${NC}"
read -r EMAIL_FROM

echo -e "${YELLOW}Email From Name:${NC}"
read -r EMAIL_FROM_NAME
EMAIL_FROM_NAME=${EMAIL_FROM_NAME:-"$COMPANY_NAME"}

echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}ANTHROPIC AI${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -e "${YELLOW}Do you want to configure Anthropic AI? (y/N):${NC}"
read -r CONFIGURE_ANTHROPIC

if [[ "$CONFIGURE_ANTHROPIC" =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Anthropic API Key:${NC}"
  read -r ANTHROPIC_API_KEY
else
  ANTHROPIC_API_KEY=""
fi

# =============================================================================
# GENERATE ENV FILE
# =============================================================================

echo ""
echo -e "${GREEN}Generating environment file...${NC}"

cat > "$ENV_FILE" <<EOF
# =============================================================================
# CLIENT: $CLIENT_ID
# Generated: $(date)
# =============================================================================

# -----------------------------------------------------------------------------
# COMPANY BRANDING
# -----------------------------------------------------------------------------

RAILWAY_PROJECT_NAME="$COMPANY_NAME"
GLOBAL_COMPANY_SLOGAN="$COMPANY_SLOGAN"
GLOBAL_COMPANY_ADDRESS="$COMPANY_ADDRESS"
GLOBAL_COMPANY_PHONE="$COMPANY_PHONE"
GLOBAL_COMPANY_EMAIL="$COMPANY_EMAIL"
RAILWAY_PUBLIC_DOMAIN="${CLIENT_ID}.railway.app"

GLOBAL_COLOR_PRIMARY="$PRIMARY_COLOR"
GLOBAL_COLOR_SECONDARY="$SECONDARY_COLOR"

FONT_FAMILY="Outfit Variable"
FONT_FAMILY_FALLBACK="sans-serif"

YEAR="$(date +%Y)"

# -----------------------------------------------------------------------------
# SUPABASE
# -----------------------------------------------------------------------------

PUBLIC_SUPABASE_URL="$SUPABASE_URL"
PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"

EOF

# Add VAPI section if configured
if [[ "$CONFIGURE_VAPI" =~ ^[Yy]$ ]]; then
  cat >> "$ENV_FILE" <<EOF
# -----------------------------------------------------------------------------
# VAPI
# -----------------------------------------------------------------------------

PUBLIC_VAPI_API_KEY="$VAPI_API_KEY"
VAPI_PHONE_NUMBER="$VAPI_PHONE"
PUBLIC_VAPI_ASSISTANT_ID_CAPCO="$PUBLIC_VAPI_ASSISTANT_ID"

EOF
fi

# Add Stripe section if configured
if [[ "$CONFIGURE_STRIPE" =~ ^[Yy]$ ]]; then
  cat >> "$ENV_FILE" <<EOF
# -----------------------------------------------------------------------------
# STRIPE
# -----------------------------------------------------------------------------

PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_PUB_KEY"
STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"

EOF
fi

# Add Email section
cat >> "$ENV_FILE" <<EOF
# -----------------------------------------------------------------------------
# RESEND
# -----------------------------------------------------------------------------

RESEND_API_KEY="$RESEND_API_KEY"
EMAIL_FROM="$EMAIL_FROM"
EMAIL_FROM_NAME="$EMAIL_FROM_NAME"

EOF

# Add Anthropic section if configured
if [[ "$CONFIGURE_ANTHROPIC" =~ ^[Yy]$ ]]; then
  cat >> "$ENV_FILE" <<EOF
# -----------------------------------------------------------------------------
# ANTHROPIC
# -----------------------------------------------------------------------------

ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"

EOF
fi

# Add production flag
cat >> "$ENV_FILE" <<EOF
# -----------------------------------------------------------------------------
# ENVIRONMENT
# -----------------------------------------------------------------------------

NODE_ENV="production"

# =============================================================================
# NOTES
# =============================================================================
# 
# To deploy this client:
# 1. Create Railway project: railway init
# 2. Link project: railway link
# 3. Set variables: railway variables set -f configs/${CLIENT_ID}.env
# 4. Deploy: railway up
#
# Or use the deploy script:
# ./scripts/deploy-client.sh $CLIENT_ID
#
# =============================================================================
EOF

echo -e "${GREEN}✓ Environment file created: $ENV_FILE${NC}"
echo ""
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}NEXT STEPS${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
echo ""
echo "1. Review and edit the file if needed:"
echo -e "   ${YELLOW}vim $ENV_FILE${NC}"
echo ""
echo "2. Test locally:"
echo -e "   ${YELLOW}cp $ENV_FILE .env && npm run dev${NC}"
echo ""
echo "3. Deploy to Railway:"
echo -e "   ${YELLOW}./scripts/deploy-client.sh $CLIENT_ID${NC}"
echo ""
echo "4. Or deploy manually:"
echo -e "   ${YELLOW}railway variables set -f $ENV_FILE${NC}"
echo -e "   ${YELLOW}railway up${NC}"
echo ""
echo -e "${GREEN}Setup complete!${NC}"

