#!/bin/bash

# =============================================================================
# DEPLOY CLIENT SCRIPT
# =============================================================================
# Deploys a client configuration to Railway
#
# Usage: ./scripts/deploy-client.sh <client-id> [environment]
#
# Examples:
#   ./scripts/deploy-client.sh acme-fire production
#   ./scripts/deploy-client.sh acme-fire staging
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Railway CLI
if ! command -v railway &> /dev/null; then
  echo -e "${RED}Error: Railway CLI not found${NC}"
  echo "Install it with: npm install -g @railway/cli"
  exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
  echo -e "${RED}Error: Not logged into Railway${NC}"
  echo "Run: railway login"
  exit 1
fi

# Get client ID
if [ -z "$1" ]; then
  echo -e "${RED}Error: Client ID required${NC}"
  echo "Usage: $0 <client-id> [environment]"
  exit 1
fi

CLIENT_ID=$1
ENVIRONMENT=${2:-production}
ENV_FILE="configs/${CLIENT_ID}.env"

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "   DEPLOYING: $CLIENT_ID"
echo "   ENVIRONMENT: $ENVIRONMENT"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Configuration file not found: $ENV_FILE${NC}"
  echo "Run: ./scripts/setup-client.sh $CLIENT_ID"
  exit 1
fi

echo -e "${GREEN}✓ Found configuration: $ENV_FILE${NC}"

# Ask for confirmation
echo ""
echo -e "${YELLOW}This will deploy with the following configuration:${NC}"
echo -e "${YELLOW}─────────────────────────────────────────${NC}"
grep -E "^(RAILWAY_PROJECT_NAME|GLOBAL_COLOR_PRIMARY|PUBLIC_SUPABASE_URL)=" "$ENV_FILE" | while read -r line; do
  echo "  $line"
done
echo -e "${YELLOW}─────────────────────────────────────────${NC}"
echo ""
echo -e "${YELLOW}Continue? (y/N):${NC}"
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo -e "${RED}Aborted${NC}"
  exit 1
fi

# Set environment variables
echo ""
echo -e "${BLUE}Setting environment variables...${NC}"
railway variables set -f "$ENV_FILE" --environment "$ENVIRONMENT"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Environment variables set${NC}"
else
  echo -e "${RED}Error setting environment variables${NC}"
  exit 1
fi

# Deploy
echo ""
echo -e "${BLUE}Deploying to Railway...${NC}"
railway up --environment "$ENVIRONMENT"

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}"
  echo "═══════════════════════════════════════════════════════════"
  echo "   DEPLOYMENT SUCCESSFUL"
  echo "═══════════════════════════════════════════════════════════"
  echo -e "${NC}"
  echo ""
  echo -e "${GREEN}Your site will be available at:${NC}"
  railway status --environment "$ENVIRONMENT" | grep -i "domain"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "1. Test the deployment"
  echo "2. Setup custom domain (optional)"
  echo "3. Configure DNS (if custom domain)"
  echo "4. Test all integrations (VAPI, Stripe, Email)"
  echo ""
else
  echo -e "${RED}Deployment failed${NC}"
  exit 1
fi

