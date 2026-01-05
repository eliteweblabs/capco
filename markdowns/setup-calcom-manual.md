# Manual Setup for Cal.com on Railway

Since Railway can't find the `calcom/cal.com` repository directly, here's how to set it up manually:

## Method 1: Use Railway Template (Easiest)

1. Go to: https://railway.com/template/calcom
2. Click "Deploy on Railway"
3. Select your project (marty-cal)
4. Railway will automatically create and configure everything

## Method 2: Create Empty Services and Configure

### Step 1: Create Database Service

1. In Railway dashboard → Your project
2. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Name it: `calcom-db`
4. Railway will auto-generate connection details

### Step 2: Create Empty Service for Cal.com

1. Click **"+ New"** → **"Empty Service"**
2. Name it: `calcom-app`

### Step 3: Configure Cal.com Service

1. Click on the `calcom-app` service
2. Go to **"Settings"** tab
3. Under **"Source"**, click **"Connect GitHub"**
4. Search for and select: `calcom/cal.com`
5. Branch: `main`
6. Root Directory: (leave empty)
7. Build Command: (leave empty - Railway will auto-detect)
8. Start Command: `npm run start`

### Step 4: Set Environment Variables

Go to **"Variables"** tab for `calcom-app` service and add:

**Database Connection:**
- `DATABASE_URL` - Get this from `calcom-db` service → Variables → `DATABASE_URL`
- `CALCOM_DB_PASSWORD` - Get from `calcom-db` service → Variables → `POSTGRES_PASSWORD`

**Cal.com Secrets (generate these):**
```bash
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For CALENDSO_ENCRYPTION_KEY
```

- `NEXTAUTH_SECRET` - (generated above)
- `CALENDSO_ENCRYPTION_KEY` - (generated above)
- `NEXTAUTH_URL` - Will be: `https://${{RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_WEBAPP_URL` - Will be: `https://${{RAILWAY_PUBLIC_DOMAIN}}`
- `NEXT_PUBLIC_WEBSITE_URL` - Will be: `https://${{RAILWAY_PUBLIC_DOMAIN}}`

**Email Configuration:**
- `EMAIL_SERVER` - `smtp://resend:${{RESEND_API_KEY}}@smtp.resend.com:587`
- `EMAIL_SERVER_HOST` - `smtp.resend.com`
- `EMAIL_SERVER_PORT` - `587`
- `EMAIL_SERVER_USER` - `resend`
- `EMAIL_SERVER_PASSWORD` - `${{RESEND_API_KEY}}`
- `EMAIL_FROM` - Your email (e.g., `app@yourdomain.com`)
- `EMAIL_FROM_NAME` - Display name (e.g., `Cal.com`)

**Other:**
- `RESEND_API_KEY` - Your Resend API key
- `NODE_ENV` - `production`
- `PORT` - `3000`

### Step 5: Deploy

1. After setting variables, Railway will automatically trigger a deployment
2. Or manually click **"Deploy"** button
3. Build will take 10-15 minutes

## Method 3: Fork and Deploy Your Own Copy

If Railway still can't access the repo:

1. Fork `calcom/cal.com` to your GitHub account
2. Then in Railway, add GitHub repo → Select your fork
3. This ensures Railway has access to the repository

