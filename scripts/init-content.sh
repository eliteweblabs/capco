#!/bin/bash

# =============================================================================
# INITIALIZE CONTENT FOR NEW DEPLOYMENT
# =============================================================================
# This script sets up the content directory for a new client deployment
#
# Usage: ./scripts/init-content.sh [client-name]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CLIENT_NAME=${1:-"default"}

echo -e "${BLUE}"
echo "═══════════════════════════════════════════════════════════"
echo "   INITIALIZE CONTENT: $CLIENT_NAME"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if content directory already exists
if [ -d "content" ]; then
  echo -e "${YELLOW}⚠️  content/ directory already exists${NC}"
  echo -e "${YELLOW}Do you want to overwrite it? (y/N):${NC}"
  read -r OVERWRITE
  if [[ ! "$OVERWRITE" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
  fi
  rm -rf content/
fi

# Check if site-config.json already exists  
if [ -f "site-config.json" ]; then
  echo -e "${YELLOW}⚠️  site-config.json already exists${NC}"
  echo -e "${YELLOW}Do you want to overwrite it? (y/N):${NC}"
  read -r OVERWRITE_CONFIG
  if [[ ! "$OVERWRITE_CONFIG" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Keeping existing site-config.json${NC}"
  else
    rm site-config.json
  fi
fi

# Create content directory structure
echo -e "${GREEN}Creating content directory structure...${NC}"
mkdir -p content/pages
mkdir -p content/sections
mkdir -p content/data

# Copy example files
echo -e "${GREEN}Copying example content files...${NC}"

# Create default home page
cat > content/pages/home.md <<'EOF'
---
title: "Welcome to Fire Protection Services"
description: "Professional fire protection plan review and approval"
hero:
  title: "Professional Fire Protection Services"
  subtitle: "Expert plan review and approval for your fire protection systems"
  cta:
    text: "Get Started"
    href: "/register"
layout: "default"
---

# Professional Fire Protection Services

We provide expert fire protection system review and approval services to ensure your buildings meet all safety codes and regulations.

## Our Services

- **Plan Review**: Comprehensive review of fire protection plans
- **Code Compliance**: Ensuring adherence to NFPA and local codes
- **Inspection Services**: On-site inspections and verification
- **Approval Processing**: Fast-track approval for compliant systems

## Why Choose Us

- Years of experience in fire protection systems
- Expert knowledge of fire codes and regulations
- Fast turnaround times
- Dedicated support team

## Get Started Today

Contact us to begin your fire protection plan review process.
EOF

# Create default contact page
cat > content/pages/contact.md <<'EOF'
---
title: "Contact Us"
description: "Get in touch with our fire protection experts"
hero:
  title: "Contact Us"
  subtitle: "Get in touch with our fire protection experts"
formUrl: "https://api.leadconnectorhq.com/widget/form/xelI3lUlBsyo4cp4hRsm"
showForm: true
---

# Get In Touch

We're here to help with all your fire protection needs.

## Office Hours

- **Monday - Friday**: 9:00 AM - 5:00 PM
- **Saturday**: By appointment only
- **Sunday**: Closed

## Response Time

We typically respond to all inquiries within 24 hours during business days.

## What to Expect

1. Submit your inquiry through the form below
2. Receive confirmation within 1 business day
3. Get a detailed response from our expert team
4. Schedule a consultation if needed

## Emergency Services

For emergency fire protection services, please call our emergency hotline.
EOF

# Create default about page
cat > content/pages/about.md <<'EOF'
---
title: "About Us"
description: "Learn more about our fire protection services"
hero:
  title: "About Us"
  subtitle: "Your trusted partner in fire safety"
---

# About Our Company

We are a leading provider of fire protection plan review and approval services.

## Our Mission

To ensure the safety of buildings and occupants through thorough, professional fire protection system review and approval.

## Our Team

Our team consists of experienced fire protection engineers, code experts, and safety professionals.

## Our Experience

- Over 10 years in the industry
- Thousands of projects reviewed
- Expertise in all major building types
- Knowledge of national and local fire codes

## Certifications

- NFPA Certified Fire Protection Specialists
- ICC Certified Building Officials
- Licensed Professional Engineers
EOF

# Copy or create site-config.json
if [ ! -f "site-config.json" ]; then
  echo -e "${GREEN}Creating site-config.json from example...${NC}"
  cp site-config.json.example site-config.json
  
  echo -e "${YELLOW}"
  echo "─────────────────────────────────────────────────────────"
  echo "  IMPORTANT: Edit site-config.json with client details"
  echo "─────────────────────────────────────────────────────────"
  echo -e "${NC}"
  echo "Update the following in site-config.json:"
  echo "  - Company name, slogan, contact info"
  echo "  - Brand colors"
  echo "  - Logo SVG"
  echo "  - Navigation items"
  echo "  - Feature flags"
fi

# Create README in content directory
cp content/README.md content/README.md 2>/dev/null || echo "Note: content/README.md not found"

echo ""
echo -e "${GREEN}"
echo "═══════════════════════════════════════════════════════════"
echo "   CONTENT INITIALIZED SUCCESSFULLY"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Edit site configuration:"
echo -e "   ${YELLOW}vim site-config.json${NC}"
echo ""
echo "2. Customize page content:"
echo -e "   ${YELLOW}vim content/pages/home.md${NC}"
echo -e "   ${YELLOW}vim content/pages/contact.md${NC}"
echo ""
echo "3. Test locally:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "4. Deploy when ready:"
echo -e "   ${YELLOW}./scripts/deploy-client.sh $CLIENT_NAME${NC}"
echo ""
echo -e "${GREEN}Content directory is gitignored - safe to customize!${NC}"

