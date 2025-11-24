# Fix Cal.com Environment Variables

## Critical Issue Found

The build completed but the app is failing to start because:

1. **Missing `NEXTAUTH_SECRET`** - Required environment variable not set
2. **Database connection issues** - `DATABASE_URL` may not be set correctly

## Quick Fix Steps

### Step 1: Set NEXTAUTH_SECRET

1. Go to Railway Dashboard → `cal.com` service → **Variables** tab
2. Click **"+ New Variable"**
3. Add:
   - **Key**: `NEXTAUTH_SECRET`
   - **Value**: `4tG5M8gnqIDmLLPW/ligvbxF7spOTbGxO3lYq4DXUjw=` (or generate new: `openssl rand -base64 32`)

### Step 2: Set CALENDSO_ENCRYPTION_KEY

1. Add another variable:
   - **Key**: `CALENDSO_ENCRYPTION_KEY`
   - **Value**: `ScclPeosvzCw9WUasD1h46N13o0QSf4dpELWKfbK9po=` (or generate new: `openssl rand -base64 32`)

### Step 3: Fix Database Connection

1. Go to **Postgres** service → **Variables** tab
2. Copy the `DATABASE_URL` value
3. Go back to **cal.com** service → **Variables** tab
4. Add/Update:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the DATABASE_URL from Postgres service
   - Make sure it's in format: `postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway`

### Step 4: Set Other Required Variables

Add these to **cal.com** service variables:

**URLs** (set after Railway generates domain):
- `NEXTAUTH_URL` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_WEBAPP_URL` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_WEBSITE_URL` = `https://${{RAILWAY_PUBLIC_DOMAIN}}`

**Email** (if using Resend):
- `RESEND_API_KEY` = (your Resend API key)
- `EMAIL_SERVER` = `smtp://resend:${{RESEND_API_KEY}}@smtp.resend.com:587`
- `EMAIL_SERVER_HOST` = `smtp.resend.com`
- `EMAIL_SERVER_PORT` = `587`
- `EMAIL_SERVER_USER` = `resend`
- `EMAIL_SERVER_PASSWORD` = `${{RESEND_API_KEY}}`
- `EMAIL_FROM` = (your email)
- `EMAIL_FROM_NAME` = (display name)

**Other**:
- `NODE_ENV` = `production`
- `PORT` = `3000`

### Step 5: Redeploy

After setting variables, Railway will auto-redeploy, or click **"Deploy"** button manually.

## Generate New Secrets (if needed)

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CALENDSO_ENCRYPTION_KEY  
openssl rand -base64 32
```

