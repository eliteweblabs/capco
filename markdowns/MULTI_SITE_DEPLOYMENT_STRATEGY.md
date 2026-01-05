# Multi-Site Deployment Strategy

## Overview

This document explains how to deploy customized versions of the fire protection system to multiple client sites while maintaining a single codebase. Each deployment can have unique branding (colors, logos, company info) without modifying the core code structure.

## 🎯 Goals

- **Quick Deployment**: Deploy new client sites in minutes
- **Branding Customization**: Each site has unique colors, logos, company info
- **Core Stability**: All sites share the same navigation, page structure, and functionality
- **Easy Updates**: Push bug fixes and features to all sites without affecting their branding

## 🏗️ Architecture

### Single Codebase, Multiple Deployments

```
astro-supabase-main (main repo)
├── Railway Project: Client A → Custom branding via env vars
├── Railway Project: Client B → Custom branding via env vars
└── Railway Project: Client C → Custom branding via env vars
```

### What Gets Customized (Per Site)

✅ **Branding** (via environment variables)

- Primary/secondary colors
- Company name, slogan
- Logo (SVG markup or URL)
- Contact info (phone, email, address)
- Favicon

✅ **Integrations** (via environment variables)

- Supabase project
- VAPI phone numbers/assistants
- Stripe accounts
- Email provider (Resend)

❌ **What Stays the Same**

- Navigation structure
- Page layouts
- Component structure
- Database schema
- Business logic

## 📋 Environment-Based Customization

### Core Branding Variables

```bash
# Company Identity
RAILWAY_PROJECT_NAME="Client Name Fire Protection"
GLOBAL_COMPANY_SLOGAN="Your Safety Partner"
GLOBAL_COMPANY_ADDRESS="123 Main St, City, ST 12345"
GLOBAL_COMPANY_PHONE="+1234567890"
GLOBAL_COMPANY_EMAIL="contact@client.com"
RAILWAY_PUBLIC_DOMAIN="client-fire.railway.app"

# Brand Colors
GLOBAL_COLOR_PRIMARY="#825BDD"  # Auto-generates palette
GLOBAL_COLOR_SECONDARY="#0ea5e9"

# Typography
FONT_FAMILY="Outfit Variable"
FONT_FAMILY_FALLBACK="sans-serif"

# Logos (SVG markup or URLs)
GLOBAL_COMPANY_LOGO_SVG="<svg>...</svg>"
GLOBAL_COMPANY_ICON_SVG="<svg>...</svg>"

# Year (for copyright)
YEAR="2025"
```

### Integration Variables

```bash
# Supabase
PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# VAPI Voice Assistant
PUBLIC_VAPI_API_KEY="..."
VAPI_PHONE_NUMBER="+1234567890"
PUBLIC_VAPI_ASSISTANT_ID_CAPCO="..."
PUBLIC_VAPI_ASSISTANT_ID_BARRY="..."

# Stripe
PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@client.com"
EMAIL_FROM_NAME="Client Name"
```

## 🚀 Deployment Methods

### Method 1: Railway Templates (Recommended)

Create a Railway template that forks your repo and prompts for environment variables.

**Steps:**

1. Create a base `railway-template.json` with all required env vars
2. Publish template to Railway
3. For each new client:
   - Click "Deploy Template"
   - Fill in client-specific values
   - Deploy → Site live in 5 minutes

**Pros:**

- Fastest deployment
- No code changes needed
- Railway handles environment setup
- Automatic SSL/domains

**Cons:**

- Client gets a separate Railway project (billing)
- Need Railway CLI for advanced config

### Method 2: Monorepo with Deployment Configs

Keep all client configs in your repo and deploy via CLI.

```
/configs
  ├── client-a.env
  ├── client-b.env
  └── client-c.env
```

**Deploy script:**

```bash
./deploy-client.sh client-a
```

**Pros:**

- Single source of truth
- Easy to track client configs
- Can use git for version control

**Cons:**

- Sensitive data in repo (use encryption)
- Manual CLI deployment

### Method 3: Environment Variable Management Service

Use a service like Doppler, Vault, or Railway's shared variables.

**Pros:**

- Centralized secret management
- No secrets in git
- Easy rotation
- Team access control

**Cons:**

- Additional service cost
- Learning curve

## 📦 Recommended Approach

### Phase 1: Setup Template Structure

1. **Create a `.env.template` file** with all required variables
2. **Create deployment scripts** for each client
3. **Document logo/branding requirements**

### Phase 2: Railway Template

1. **Create `railway-template.json`** with:
   - Service configuration
   - Required env vars with descriptions
   - Suggested values

2. **Publish to Railway Templates**
   - Makes deployment a 1-click operation
   - Non-technical team members can deploy

### Phase 3: Update Process

When you push updates to main:

1. Core functionality updates automatically
2. Branding stays untouched (env vars)
3. Test on staging first
4. Deploy to all clients via Railway CLI or webhooks

## 🎨 Branding Customization System

### How It Works

Your codebase already has excellent branding abstraction:

1. **Colors** (`tailwind.config.mjs`):
   - Reads `GLOBAL_COLOR_PRIMARY` env var
   - Generates full palette automatically via `generateColorPalette()`
   - Applies to all components

2. **Company Data** (`src/pages/api/global/global-company-data.ts`):
   - Single source of truth for company info
   - Used by all components via import
   - Supports SVG logos and URLs

3. **Manifest** (`scripts/process-manifest.js`):
   - Processes `manifest.json.template` at build time
   - Injects env vars for PWA settings

4. **Typography** (`tailwind.config.mjs`):
   - Dynamic font family from env

### Adding New Branding Elements

To add a new customizable element:

1. **Add env var** to `.env.template`
2. **Import in `global-company-data.ts`**
3. **Use in components** via import
4. **Update Railway template** to prompt for it

Example:

```typescript
// global-company-data.ts
export const globalCompanyData = () => ({
  // ...existing
  globalCompanyTagline: process.env.GLOBAL_COMPANY_TAGLINE || "Default Tagline",
});
```

## 🔄 Update Workflow

### For Core Features (Navigation, Layout, Business Logic)

```bash
# Make changes in main repo
git add .
git commit -m "feat: add new dashboard widget"
git push origin main

# All Railway deployments auto-update (if auto-deploy enabled)
# Or manually trigger via Railway dashboard
```

### For Client-Specific Changes

```bash
# Update env vars in Railway dashboard
# Or via CLI:
railway variables set GLOBAL_COLOR_PRIMARY="#FF5733" --project client-a

# Redeploy
railway up --project client-a
```

### For Database Schema Changes

```bash
# Run migration on each client's Supabase
# (each client has separate Supabase project)
supabase db push --project-id client-a-ref
supabase db push --project-id client-b-ref
```

## 📝 Client Onboarding Checklist

### 1. Gather Requirements

- [ ] Company name and slogan
- [ ] Brand colors (primary/secondary)
- [ ] Logo files (SVG preferred)
- [ ] Contact info (phone, email, address)
- [ ] Domain preference (custom or Railway subdomain)

### 2. Setup Infrastructure

- [ ] Create Supabase project
- [ ] Create VAPI assistant
- [ ] Setup Stripe account
- [ ] Setup Resend domain
- [ ] Create Railway project

### 3. Configure Environment

- [ ] Copy `.env.template` to `.env.client-name`
- [ ] Fill in all variables
- [ ] Test locally with client env

### 4. Deploy

- [ ] Deploy to Railway
- [ ] Generate domain
- [ ] Test all features
- [ ] Setup custom domain (if needed)

### 5. Handoff

- [ ] Share credentials securely
- [ ] Provide user guide
- [ ] Schedule training call

## 🛠️ Tools & Scripts Needed

### 1. `.env.template`

Complete template with all required variables and descriptions.

### 2. `deploy-client.sh`

```bash
#!/bin/bash
# Usage: ./deploy-client.sh client-name

CLIENT=$1
ENV_FILE="configs/${CLIENT}.env"

# Load env vars
source $ENV_FILE

# Deploy to Railway
railway up --project $CLIENT --environment production
```

### 3. `setup-client.sh`

Interactive script to gather client info and generate env file.

### 4. `update-all-clients.sh`

Deploy core updates to all clients.

### 5. Railway Template JSON

Pre-configured template for 1-click deployment.

## 🔐 Security Considerations

### Sensitive Data

- **Never commit** real API keys to git
- **Use Railway secrets** for production
- **Use `.env.local`** for development
- **Encrypt** client config files if stored in repo

### Access Control

- **Separate Supabase projects** per client (RLS isolation)
- **Separate Stripe accounts** (financial isolation)
- **Railway teams** with role-based access

### Database Isolation

Each client gets:

- Own Supabase project
- Own RLS policies
- Own auth users
- No cross-client data access

## 📊 Comparison: Deployment Methods

| Method           | Setup Time | Deploy Time | Cost            | Maintenance |
| ---------------- | ---------- | ----------- | --------------- | ----------- |
| Railway Template | 2 hours    | 5 mins      | $5-20/client/mo | Low         |
| Monorepo Configs | 1 hour     | 10 mins     | $5-20/client/mo | Medium      |
| Manual Deploy    | 0 hours    | 30 mins     | $5-20/client/mo | High        |
| Shared Infra     | 4 hours    | 15 mins     | $20/mo total    | High        |

**Recommendation:** Railway Template for scalability

## 🎯 Next Steps

1. **Create `.env.template`** (see next section)
2. **Create `railway-template.json`**
3. **Write deployment scripts**
4. **Document branding guidelines**
5. **Test with 2-3 pilot clients**
6. **Automate where possible**

## 📚 Related Documentation

- [Railway Template Setup](./RAILWAY_TEMPLATE_SETUP.md) (to be created)
- [Client Branding Guide](./CLIENT_BRANDING_GUIDE.md) (to be created)
- [Deployment Scripts](./DEPLOYMENT_SCRIPTS.md) (to be created)
- [VAPI Unified Agent Setup](./VAPI_UNIFIED_AGENT_SETUP.md)

---

**Key Insight:** Your codebase is already well-architected for multi-tenancy! The environment variable system and `global-company-data.ts` provide clean abstraction. Focus on tooling/automation around this existing pattern.
