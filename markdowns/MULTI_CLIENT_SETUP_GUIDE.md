# Multi-Client Setup Guide

## 🎯 Quick Start: Deploy a New Client Site

This guide shows you how to deploy a rebranded version of the fire protection system for a new client in under 10 minutes.

## Prerequisites

- Railway account (free tier works)
- GitHub repository access
- Client branding assets (logo, colors, company info)

## Step-by-Step Setup

### Step 1: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will auto-detect the Dockerfile

### Step 2: Set Environment Variables

Go to your Railway project → **Variables** tab and add these **required** variables:

#### Company Identity
```bash
RAILWAY_PROJECT_NAME="Client Name Fire Protection"
GLOBAL_COMPANY_SLOGAN="Your Safety Partner"
GLOBAL_COMPANY_ADDRESS="123 Main St, City, ST 12345"
GLOBAL_COMPANY_PHONE="+1234567890"
GLOBAL_COMPANY_EMAIL="contact@client.com"
RAILWAY_PUBLIC_DOMAIN="client-fire.railway.app"
YEAR="2025"
```

#### Brand Colors
```bash
GLOBAL_COLOR_PRIMARY="#825BDD"    # Main brand color (hex)
GLOBAL_COLOR_SECONDARY="#0ea5e9"  # Secondary color (hex)
```

#### Logos (SVG Markup)
```bash
# Company Logo (horizontal, used in navbar/footer)
GLOBAL_COMPANY_LOGO_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">...</svg>'

# Company Icon (square, used for favicon)
GLOBAL_COMPANY_ICON_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">...</svg>'
```

#### Supabase (Database)
```bash
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_PUBLISHABLE="your_publishable_key"
SUPABASE_SECRET="your_service_role_key"
```

#### Other Integrations (Optional)
```bash
# VAPI Voice Assistant
VAPI_API_KEY="your_vapi_key"
PUBLIC_VAPI_ASSISTANT_ID="assistant_id"

# Stripe Payments
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_SECRET_KEY="sk_live_..."

# Email (Resend)
EMAIL_API_KEY="re_..."
FROM_EMAIL="noreply@client.com"
FROM_NAME="Client Name"
```

### Step 3: Set Up Persistent Volume (Optional but Recommended)

1. Go to Railway project → **Volumes** tab
2. Click **"New Volume"**
3. Configure:
   - **Name**: `content-storage`
   - **Mount Path**: `/data/content`
   - **Size**: 1GB

This allows custom content to persist across deployments.

### Step 4: Deploy

Railway will automatically deploy when you:
- Push to the connected GitHub branch, OR
- Click **"Deploy"** in Railway dashboard

### Step 5: Customize Content (After First Deploy)

Once deployed, you can customize content via:

**Option A: Railway Environment Variables** (Quick)
```bash
PAGE_HOME_JSON='{"title":"Custom Home","content":"# Welcome\n\nCustom content"}'
```

**Option B: Persistent Volume** (Full Control)
```bash
# SSH into Railway
railway shell

# Edit markdown files
nano /data/content/pages/home.md
```

## ✅ What Gets Customized Per Client

- ✅ Company name, slogan, contact info
- ✅ Brand colors (primary/secondary)
- ✅ Logos (company logo + icon)
- ✅ Typography (font family)
- ✅ Page content (via volume or env vars)
- ✅ Integrations (Supabase, VAPI, Stripe, Email)

## ❌ What Stays the Same (Shared Codebase)

- ❌ Navigation structure
- ❌ Page layouts
- ❌ Component structure
- ❌ Database schema
- ❌ Business logic
- ❌ Feature set

## 🎨 Logo Requirements

### Company Logo
- **Format**: SVG (recommended) or PNG
- **Dimensions**: ~200x60px (horizontal)
- **Usage**: Navbar, footer, emails
- **Dark Mode**: Should work on both light/dark backgrounds

### Company Icon
- **Format**: SVG (recommended) or PNG
- **Dimensions**: 512x512px (square)
- **Usage**: Favicon, PWA icon
- **Design**: Simple, recognizable at small sizes

### Converting Logo to SVG

**Option 1: Use Online Tool**
- Upload PNG/JPG to [CloudConvert](https://cloudconvert.com/png-to-svg)
- Download SVG
- Copy SVG markup

**Option 2: Use Figma/Illustrator**
- Export as SVG
- Copy SVG code
- Paste into `GLOBAL_COMPANY_LOGO_SVG` env var

### SVG Format Example

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60">
  <style>
    .fill { fill: #000; }
    @media (prefers-color-scheme: dark) {
      .fill { fill: #fff; }
    }
  </style>
  <path class="fill" d="M10,10 L190,10 L190,50 L10,50 Z"/>
  <text class="fill" x="100" y="35" text-anchor="middle">Logo</text>
</svg>
```

## 🔄 Updating All Clients

When you push code updates to GitHub:

1. **Core features update automatically** (all clients)
2. **Branding stays untouched** (env vars persist)
3. **Content persists** (volume storage)

To update a specific client:
```bash
# Deploy to specific Railway project
railway up --project client-name
```

## 📋 Environment Variable Checklist

Copy this checklist for each new client:

- [ ] `RAILWAY_PROJECT_NAME` - Company name
- [ ] `GLOBAL_COMPANY_SLOGAN` - Tagline
- [ ] `GLOBAL_COMPANY_ADDRESS` - Physical address
- [ ] `GLOBAL_COMPANY_PHONE` - Phone number
- [ ] `GLOBAL_COMPANY_EMAIL` - Contact email
- [ ] `RAILWAY_PUBLIC_DOMAIN` - Website domain
- [ ] `GLOBAL_COLOR_PRIMARY` - Main brand color
- [ ] `GLOBAL_COLOR_SECONDARY` - Secondary color
- [ ] `GLOBAL_COMPANY_LOGO_SVG` - Logo SVG markup
- [ ] `GLOBAL_COMPANY_ICON_SVG` - Icon SVG markup
- [ ] `PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `PUBLIC_SUPABASE_PUBLISHABLE` - Supabase publishable key
- [ ] `SUPABASE_SECRET` - Supabase service role key
- [ ] `YEAR` - Copyright year

## 🐛 Troubleshooting

### Logo Not Showing
- Check SVG markup is valid
- Ensure SVG is properly escaped in env var
- Try wrapping in single quotes: `'<svg>...</svg>'`

### Colors Not Applying
- Verify hex format: `#825BDD` (with #)
- Check build logs for color generation errors
- Ensure `GLOBAL_COLOR_PRIMARY` is set

### Content Not Persisting
- Verify volume is mounted at `/data/content`
- Check volume exists in Railway dashboard
- Ensure initialization script ran on first deploy

## 📚 Additional Resources

- [Client Branding Guide](./markdowns/CLIENT_BRANDING_GUIDE.md) - Detailed branding customization
- [Multi-Site Deployment Strategy](./markdowns/MULTI_SITE_DEPLOYMENT_STRATEGY.md) - Architecture overview
- [Railway Documentation](https://docs.railway.app) - Railway-specific help

## 💡 Pro Tips

1. **Keep a template**: Maintain a "template client" with good defaults
2. **Test locally first**: Use `.env` file to test branding before deploying
3. **Document customizations**: Keep notes on what's unique per client
4. **Use Railway templates**: Create a Railway template for 1-click deployments
5. **Backup content**: Export volume content before major updates

