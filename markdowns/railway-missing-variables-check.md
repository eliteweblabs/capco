# Railway Missing Variables Check

Generated: 2026-01-31

## Critical Variables (Required by Railway Template)

These are **REQUIRED** variables according to `railway-template.json`:

### 1. Company/Brand Variables

- ✅ `RAILWAY_PROJECT_NAME` - Should be "CAPCO Design Group" or "Rothco Built"
- ⚠️ `GLOBAL_COMPANY_SLOGAN` - Optional
- ⚠️ `GLOBAL_COMPANY_ADDRESS` - Optional
- ✅ `GLOBAL_COMPANY_PHONE` - Required (use your actual phone)
- ✅ `GLOBAL_COMPANY_EMAIL` - Required (use your admin email)
- ✅ `GLOBAL_COLOR_PRIMARY` - Required (hex color)
- ⚠️ `GLOBAL_COLOR_SECONDARY` - Optional
- ⚠️ `FONT_FAMILY` - Optional (default: "Outfit Variable")
- ⚠️ `FONT_FAMILY_FALLBACK` - Optional
- ⚠️ `YEAR` - Optional (default: 2025)

### 2. Supabase (Required)

- ✅ `PUBLIC_SUPABASE_URL` = `https://qudlxlryegnainztkrtk.supabase.co`
- ✅ `PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGci...` (your anon key)
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - **MISSING in .env!**
  - Your .env has: `SUPABASE_SECRET` and `PUBLIC_SUPABASE_PUBLISHABLE`
  - Railway needs: `SUPABASE_SERVICE_ROLE_KEY`
  - **Action: Add the service role key to Railway**

### 3. Email (Required - Resend)

- ✅ `RESEND_API_KEY` = `re_HY32mGph_EZW1cR77aFPHbxMzuqVnJZ1t`
- ✅ `EMAIL_FROM` = `noreply@capcofire.com` (use `FROM_EMAIL` from .env)
- ✅ `EMAIL_FROM_NAME` = `CAPCO Design Group` (use `FROM_NAME` from .env)

### 4. Node Environment

- ✅ `NODE_ENV` = `production`

## Optional Variables (From Railway Template)

### VAPI Voice Assistant

- ⚠️ `PUBLIC_VAPI_API_KEY` - You have `PUBLIC_VAPI_KEY` in .env
- ⚠️ `VAPI_PHONE_NUMBER` = `+16175810583`
- ⚠️ `PUBLIC_VAPI_ASSISTANT_ID_CAPCO` - You have `PUBLIC_VAPI_ASSISTANT_ID`

### Stripe

- ⚠️ `PUBLIC_STRIPE_PUBLISHABLE_KEY` = `STRIPE_PUBLISHABLE_KEY` from .env
- ⚠️ `STRIPE_SECRET_KEY` = from .env

### AI/Anthropic

- ⚠️ `ANTHROPIC_API_KEY` = `sk-ant-api03-Zsr1w...` (from .env)

## Additional Variables from .env (May Be Needed)

### Variables NOT in Railway Template but in your .env:

#### 1. Gmail Integration

- `GMAIL_CLIENT_ID`
- `GMAIL_CLIENT_SECRET`
- `PUBLIC_URL` (currently `http://localhost:4321` - should be Railway domain)

#### 2. Google Services

- `PUBLIC_GOOGLE_MAPS_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_PLACES_API_SECRET_KEY`
- `GOOGLE_MAPS_API_KEY`
- `MAPBOX_PUBLIC_KEY`
- `GOOGLE_CONTACTS_CLIENT_ID`
- `GOOGLE_CONTACTS_CLIENT_SECRET`
- `GOOGLE_PEOPLE_CLIENT_ID`
- `GOOGLE_PEOPLE_CLIENT_SECRET`
- `GOOGLE_AUTH_CLIENT_ID`
- `GOOGLE_AUTH_SECRET`
- `GOOGLE_VOICE`

#### 3. Database Connections

- `CMS_POSTGRES_URL`
- `CMS_PG_DATABASE`
- `CMS_PG_USER`
- `CMS_PG_PASSWORD`
- `CMS_PG_HOST`
- `CMS_PG_PORT`
- `CALCOM_DATABASE_URL`

#### 4. Resend

- `RESEND_WEBHOOK_SECRET`
- `EMAIL_PROVIDER_URL`
- `EMAIL_PROVIDER`
- `EMAIL_API_KEY` (duplicate of RESEND_API_KEY?)

#### 5. Stripe

- `STRIPE_DOMAIN_ID`

#### 6. Mailgun

- `MAILGUN_API`
- `MAILGUN_SANDBOX_DOMAIN`
- `MAILGUN_BASE_URL`
- `MAILGUN_WEBHOOK_SIGNING_KEY`

#### 7. Push Notifications (VAPID)

- `VAPID_EMAIL`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

#### 8. Campfire

- `PUBLIC_CAMPFIRE_URL`
- `PUBLIC_CAMPFIRE_WIDGET_ID`

#### 9. Certificates

- `CERT_PATH`
- `CERT_PASSWORD`
- `CERT_BASE64`

#### 10. VAPI Additional

- `VAPI_PAYMENT_ASSISTANT_ID`
- `VAPI_API_KEY`

#### 11. Business Info

- `GLOBAL_BUSINESS_OWNER_NAME`

## Variables to Set in Railway

### For CAPCO Fire Protection

```bash
# Required - Company Info
RAILWAY_PROJECT_NAME="CAPCO Design Group"
GLOBAL_COMPANY_PHONE="+16175810583"
GLOBAL_COMPANY_EMAIL="admin@capcofire.com"
GLOBAL_COLOR_PRIMARY="#825BDD"
NODE_ENV="production"

# Required - Supabase
PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="eyJhbGci...your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="<NEED TO GET FROM SUPABASE DASHBOARD>"

# Required - Email
RESEND_API_KEY="re_xxxxx...your-resend-key"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Company Name"

# Optional but Recommended - VAPI
PUBLIC_VAPI_KEY="your-vapi-public-key"
PUBLIC_VAPI_ASSISTANT_ID="your-assistant-id"
VAPI_PHONE_NUMBER="+1234567890"
VAPI_API_KEY="your-vapi-api-key"

# Optional - Stripe
STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx...your-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_test_xxxxx...your-stripe-secret-key"

# Optional - Google Maps
PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_PLACES_API_KEY="your-google-places-api-key"
GOOGLE_PLACES_API_SECRET_KEY="your-google-places-secret"

# Optional - Gmail
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-your-client-secret"

# Optional - Other Services
ANTHROPIC_API_KEY="sk-ant-api03-your-anthropic-key"
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_EMAIL="mailto:your-email@example.com"

# Database (if using external Postgres)
CMS_POSTGRES_URL="postgresql://user:password@host:5432/database"

# Public URL (will be set by Railway automatically)
PUBLIC_URL="https://capcofire.com"
```

## CRITICAL MISSING ITEMS

### 🚨 Most Important

1. **SUPABASE_SERVICE_ROLE_KEY** - You need to get this from your Supabase dashboard:
   - Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/api
   - Copy the "service_role" key (not the anon key)
   - Add it to Railway

### ⚠️ Variable Name Mismatches

Your .env uses different names than Railway template expects:

| Your .env                | Railway Template                |
| ------------------------ | ------------------------------- |
| `FROM_EMAIL`             | `EMAIL_FROM`                    |
| `FROM_NAME`              | `EMAIL_FROM_NAME`               |
| `PUBLIC_VAPI_KEY`        | `PUBLIC_VAPI_API_KEY`           |
| `STRIPE_PUBLISHABLE_KEY` | `PUBLIC_STRIPE_PUBLISHABLE_KEY` |

## How to Set Variables in Railway

### Option 1: Via Railway Dashboard

1. Go to https://railway.app/dashboard
2. Select your project (CAPCO or Rothco)
3. Go to Variables tab
4. Add each variable manually

### Option 2: Via Railway CLI (after login)

```bash
railway login
railway link  # Link to your project
railway variables set VARIABLE_NAME="value"
```

### Option 3: Bulk Import

Create a `.env.railway` file and import:

```bash
railway variables --from-file .env.railway
```

## Next Steps

1. ✅ Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase dashboard
2. ✅ Set all REQUIRED variables in Railway
3. ✅ Set OPTIONAL variables you need (VAPI, Stripe, etc.)
4. ✅ Update `PUBLIC_URL` to your Railway domain
5. ✅ Test deployment
6. ✅ Verify each service works (email, auth, database, etc.)
