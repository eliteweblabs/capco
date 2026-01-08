# Railway Environment Variables Checklist

## ✅ Variables You Have (from screenshot)

Based on your Railway dashboard, you have these variables set:

### BIRD Integration
- ✅ `BIRD_ACCESS_KEY`
- ✅ `BIRD_IDENTITY_SIGNING_KEY`
- ✅ `BIRD_ISSUER`
- ✅ `BIRD_ORIGIN`
- ✅ `BIRD_WORKSPACE_ID`

### Email Configuration
- ✅ `EMAIL_FROM`
- ✅ `EMAIL_FROM_NAME`
- ✅ `EMAIL_SERVER_HOST`
- ✅ `EMAIL_SERVER_PASSWORD`
- ✅ `EMAIL_SERVER_PORT`
- ✅ `EMAIL_SERVER_USER`
- ⚠️ `EMAIL_API_KEY` (marked with '!' - needs value)
- ⚠️ `EMAIL_PROVIDER` (marked with '!' - needs value)

### VAPI
- ✅ `PUBLIC_VAPI_KEY`
- ✅ `VAPI_API_KEY`

---

## ❌ CRITICAL Missing Variables (Required for Multi-Client)

These are **marked with '!' in your Railway dashboard** and need to be set:

### 🎨 Brand Colors (CRITICAL - Just Fixed!)
- ❌ `GLOBAL_COLOR_PRIMARY` - **SET THIS NOW!** (e.g., `#825BDD`)
- ❌ `GLOBAL_COLOR_SECONDARY` - **SET THIS NOW!** (e.g., `#0ea5e9`)

### 🏢 Company Identity (Required)
- ❓ `RAILWAY_PROJECT_NAME` - Company name (not visible in screenshot)
- ❓ `GLOBAL_COMPANY_SLOGAN` - Company tagline (not visible)
- ❓ `GLOBAL_COMPANY_ADDRESS` - Physical address (not visible)
- ❓ `GLOBAL_COMPANY_EMAIL` - Contact email (not visible)
- ❓ `GLOBAL_COMPANY_PHONE` - Phone number (not visible)
- ❓ `RAILWAY_PUBLIC_DOMAIN` - Website domain (not visible)

### 🎨 Branding Assets
- ⚠️ `GLOBAL_COMPANY_ICON_SVG` - Favicon/icon SVG (marked with '!')
- ❓ `GLOBAL_COMPANY_LOGO_SVG` - Company logo SVG (not visible)

### 📧 Email (Alternative Names)
- ⚠️ `FROM_EMAIL` - Email sender address (marked with '!' - might duplicate `EMAIL_FROM`)
- ⚠️ `FROM_NAME` - Email sender name (marked with '!' - might duplicate `EMAIL_FROM_NAME`)

### 🗄️ Supabase Database (CRITICAL)
- ⚠️ `SUPABASE_URI` - Supabase project URL (marked with '!')
- ⚠️ `SUPABASE_ANON_KEY` - Supabase anonymous key (marked with '!')
- ⚠️ `SUPABASE_ADMIN_KEY` - Supabase admin key (marked with '!')

**Note:** Your Dockerfile expects:
- `PUBLIC_SUPABASE_URL` (not `SUPABASE_URI`)
- `PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`)
- `SUPABASE_ADMIN_KEY` (correct)
- `PUBLIC_SUPABASE_PUBLISHABLE` (not visible)
- `SUPABASE_SECRET` (not visible)

### 📞 Twilio (If using)
- ⚠️ `TWILIO_SID` - Twilio Account SID (marked with '!')
- ⚠️ `TWILIO_AUTH_TOKEN` - Twilio Auth Token (marked with '!')
- ⚠️ `TWILIO_PHONE_NUMBER` - Twilio phone number (marked with '!')

### 🌐 Other
- ⚠️ `SITE_URL` - Site URL (marked with '!' - might duplicate `RAILWAY_PUBLIC_DOMAIN`)
- ⚠️ `FONT_FAMILY` - Font family (optional, marked with '!')

---

## 🔧 Quick Fix Guide

### Step 1: Set Color Variables (Most Important!)

In Railway, add these two variables:

```bash
GLOBAL_COLOR_PRIMARY="#825BDD"
GLOBAL_COLOR_SECONDARY="#0ea5e9"
```

Replace `#825BDD` and `#0ea5e9` with your client's actual brand colors.

### Step 2: Set Company Identity Variables

Add these if they're missing:

```bash
RAILWAY_PROJECT_NAME="Your Company Name"
GLOBAL_COMPANY_SLOGAN="Your Company Tagline"
GLOBAL_COMPANY_ADDRESS="123 Main St, City, ST 12345"
GLOBAL_COMPANY_EMAIL="contact@yourcompany.com"
GLOBAL_COMPANY_PHONE="+15551234567"
RAILWAY_PUBLIC_DOMAIN="yourcompany.railway.app"
```

### Step 3: Fix Supabase Variable Names

Your Dockerfile expects these names (check if you have them):

```bash
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"  # Not SUPABASE_URI
PUBLIC_SUPABASE_ANON_KEY="your-anon-key"                # Not SUPABASE_ANON_KEY
PUBLIC_SUPABASE_PUBLISHABLE="your-publishable-key"
SUPABASE_ADMIN_KEY="your-admin-key"
SUPABASE_SECRET="your-secret"
```

### Step 4: Set Email Variables

If using Resend or similar:

```bash
EMAIL_PROVIDER="resend"  # or "mailgun"
EMAIL_API_KEY="re_your_key_here"
FROM_EMAIL="noreply@yourcompany.com"
FROM_NAME="Your Company Name"
```

### Step 5: Set Logo/Icon (Optional but Recommended)

```bash
GLOBAL_COMPANY_LOGO_SVG='<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
GLOBAL_COMPANY_ICON_SVG='<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
```

---

## 📋 Complete Variable List for Multi-Client Setup

Here's the complete list of variables you should have:

### Required (Must Have)
- `RAILWAY_PROJECT_NAME`
- `GLOBAL_COLOR_PRIMARY` ⚠️ **MISSING**
- `GLOBAL_COLOR_SECONDARY` ⚠️ **MISSING**
- `RAILWAY_PUBLIC_DOMAIN`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ADMIN_KEY`
- `EMAIL_PROVIDER`
- `EMAIL_API_KEY`
- `FROM_EMAIL`
- `FROM_NAME`

### Recommended (Should Have)
- `GLOBAL_COMPANY_SLOGAN`
- `GLOBAL_COMPANY_ADDRESS`
- `GLOBAL_COMPANY_EMAIL`
- `GLOBAL_COMPANY_PHONE`
- `GLOBAL_COMPANY_LOGO_SVG`
- `GLOBAL_COMPANY_ICON_SVG` ⚠️ **MISSING**
- `YEAR`
- `FONT_FAMILY` ⚠️ **MISSING**

### Optional (Nice to Have)
- `VAPI_API_KEY` ✅ You have this
- `PUBLIC_VAPI_KEY` ✅ You have this
- `TWILIO_SID` ⚠️ **MISSING** (if using Twilio)
- `TWILIO_AUTH_TOKEN` ⚠️ **MISSING** (if using Twilio)
- `TWILIO_PHONE_NUMBER` ⚠️ **MISSING** (if using Twilio)

---

## 🚨 Immediate Action Required

**Set these two variables RIGHT NOW** (they're causing the color issue):

1. Go to Railway → Your Project → Variables
2. Click "New Variable"
3. Add:
   - Name: `GLOBAL_COLOR_PRIMARY`
   - Value: `#825BDD` (or your brand color)
4. Add:
   - Name: `GLOBAL_COLOR_SECONDARY`
   - Value: `#0ea5e9` (or your secondary color)
5. Redeploy your application

After setting these, the colors will work correctly!

