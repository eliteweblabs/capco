#!/bin/bash

# =============================================================================
# UPDATE ALL CLIENTS SCRIPT
# =============================================================================
# Pushes core updates to all client deployments
# Use this when you've made changes to navigation, layouts, or business logic
# that should apply to all clients
#
# Usage: ./scripts/update-all-clients.sh [--force]
#
# Options:
#   --force    Skip confirmation prompts
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FORCE=false
if [ "$1" == "--force" ]; then
  FORCE=true
fi

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "   UPDATE ALL CLIENTS"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

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

# Find all client configs
if [ ! -d "configs" ]; then
  echo -e "${RED}Error: configs directory not found${NC}"
  echo "Create client configs first with: ./scripts/setup-client.sh"
  exit 1
fi

CLIENT_CONFIGS=(configs/*.env)
if [ ${#CLIENT_CONFIGS[@]} -eq 0 ]; then
  echo -e "${RED}Error: No client configurations found${NC}"
  exit 1
fi

echo -e "${YELLOW}Found ${#CLIENT_CONFIGS[@]} client configuration(s)${NC}"
echo ""

# List clients
echo -e "${BLUE}Clients to update:${NC}"
for config in "${CLIENT_CONFIGS[@]}"; do
  client_name=$(basename "$config" .env)
  company_name=$(grep "RAILWAY_PROJECT_NAME" "$config" | cut -d'"' -f2)
  echo -e "  ${GREEN}•${NC} $client_name ($company_name)"
done
echo ""

# Show git status
echo -e "${BLUE}Current commit:${NC}"
echo "  $(git log -1 --oneline)"
echo ""

# Confirm
if [ "$FORCE" = false ]; then
  echo -e "${YELLOW}This will deploy the current code to all clients.${NC}"
  echo -e "${YELLOW}Client-specific branding (colors, logos, etc.) will NOT change.${NC}"
  echo ""
  echo -e "${YELLOW}Continue? (y/N):${NC}"
  read -r CONFIRM

  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
  fi
fi

echo ""
echo -e "${GREEN}Starting deployment to all clients...${NC}"
echo ""

# Deploy to each client
SUCCESS_COUNT=0
FAILURE_COUNT=0
FAILED_CLIENTS=()

for config in "${CLIENT_CONFIGS[@]}"; do
  client_id=$(basename "$config" .env)
  company_name=$(grep "RAILWAY_PROJECT_NAME" "$config" | cut -d'"' -f2)
  
  echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
  echo -e "${BLUE}Deploying to: $client_id ($company_name)${NC}"
  echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"
  
  # Try to deploy
  if railway up --project "$client_id" --environment production 2>&1; then
    echo -e "${GREEN}✓ $client_id deployed successfully${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    echo -e "${RED}✗ $client_id deployment failed${NC}"
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    FAILED_CLIENTS+=("$client_id")
  fi
  
  echo ""
done

# Summary
echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "   DEPLOYMENT SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"
echo -e "${GREEN}Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}Failed: $FAILURE_COUNT${NC}"

if [ $FAILURE_COUNT -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed clients:${NC}"
  for client in "${FAILED_CLIENTS[@]}"; do
    echo -e "  ${RED}•${NC} $client"
  done
  echo ""
  echo -e "${YELLOW}To retry a specific client:${NC}"
  echo "  ./scripts/deploy-client.sh <client-id>"
fi

echo ""

# Exit with error if any deployment failed
if [ $FAILURE_COUNT -gt 0 ]; then
  exit 1
fi

echo -e "${GREEN}All deployments completed successfully!${NC}"

