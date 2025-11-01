# Deploy Plausible Analytics to Railway

## 🚀 Quick Setup Guide

### Step 1: Create Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `astro-supabase-main` repository
5. Name it: `capco-plausible-analytics`

### Step 2: Configure Services
Railway will automatically detect the `railway-plausible.json` file and create the services.

### Step 3: Set Environment Variables
In your Railway project dashboard, go to Variables and add:

```bash
# Database
PLAUSIBLE_DB_PASSWORD=your_secure_password_here

# Plausible Configuration  
PLAUSIBLE_SECRET_KEY=your_secret_key_here
PLAUSIBLE_BASE_URL=https://capco-plausible-analytics.railway.app
PLAUSIBLE_MAILER_EMAIL=admin@capcofire.com

# SMTP Configuration (required - must be integer)
SMTP_HOST_PORT=25

# Admin User
PLAUSIBLE_ADMIN_EMAIL=admin@capcofire.com
PLAUSIBLE_ADMIN_PASSWORD=your_admin_password_here
```

### Step 4: Generate Secure Values
Run these commands to generate secure values:

```bash
# Generate database password
openssl rand -base64 32

# Generate secret key
openssl rand -base64 64

# Generate admin password
openssl rand -base64 32
```

### Step 5: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Wait for all services to be healthy
3. Access your Plausible dashboard at the Railway URL

### Step 6: Configure Your Site
1. Login to Plausible with admin credentials
2. Add your site: `capcofire.com`
3. Copy the tracking script
4. Add it to your main app

### Step 7: Update Your App
Add these environment variables to your main app:

```bash
PLAUSIBLE_URL=https://capco-plausible-analytics.railway.app
PLAUSIBLE_API_KEY=your_api_key_from_plausible
```

## 🔧 Troubleshooting

### SMTP_HOST_PORT Error
**Error**: `Config variable SMTP_HOST_PORT must be an integer. Got ""`

**Solution**: 
1. Go to Railway Dashboard → Your Project → Variables
2. Add or verify `SMTP_HOST_PORT` is set to `25` (without quotes in Railway UI)
3. Ensure it's set at the **project level** (not service level) so all services can access it
4. Redeploy the service

**Note**: Railway environment variables should be set as strings in the UI, but Plausible will parse `SMTP_HOST_PORT` as an integer internally.

### Services Not Starting
- Check that all environment variables are set
- Ensure database passwords match between services
- Check Railway logs for specific errors
- Verify `SMTP_HOST_PORT=25` is set (critical for Plausible to start)

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check that PostgreSQL service is healthy
- Ensure ClickHouse service is running

### Admin Login Issues
- Verify `ADMIN_USER_EMAIL` and `ADMIN_USER_PWD` are set
- Check that `DISABLE_REGISTRATION=true`
- Try resetting admin password in Railway variables

## 📊 Usage

Once deployed:
1. **Access Dashboard**: `https://capco-plausible-analytics.railway.app`
2. **Add Site**: Enter `capcofire.com` 
3. **Get Tracking Script**: Copy the script to your main app
4. **View Analytics**: Check your analytics page at `/admin/analytics`

## 🔄 Updates

To update Plausible:
1. Push changes to GitHub
2. Railway will automatically redeploy
3. Check Railway dashboard for deployment status
