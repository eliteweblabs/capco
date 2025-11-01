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
PLAUSIBLE_MAILER_EMAIL=noreply@capcofire.com

# SMTP Configuration (using Resend)
# Note: SMTP settings are configured in railway-plausible.json
# You just need to set RESEND_API_KEY (should already exist in your main project)
RESEND_API_KEY=re_your_resend_api_key_here

# Admin User
PLAUSIBLE_ADMIN_EMAIL=admin@capcofire.com
PLAUSIBLE_ADMIN_PASSWORD=your_admin_password_here
```

**Note**: The configuration uses Resend's SMTP (`smtp.resend.com` on port `587`) instead of a local mail service. Make sure your `RESEND_API_KEY` is set in Railway.

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

### Invalid Boolean Value Error
**Error**: `Invalid boolean value: "". Expected one of: 1, 0, t, f, true, false, y, n, yes, no, on, off`

**Most Common Cause**: `SMTP_HOST_SSL_ENABLED` is set to an empty string `""`

**Solution**: 
1. Go to Railway Dashboard → Your Project → Variables
2. Find `SMTP_HOST_SSL_ENABLED`
3. **Change it from empty `""` to `false`**
   - Port 25 uses unencrypted SMTP, so set to `false`
   - For SSL/TLS (ports 465/587), use `true`
4. **Also check these other boolean variables**:
   - `ENABLE_EMAIL_VERIFICATION` - set to `false` (or remove if not needed)
   - `DISABLE_REGISTRATION` - set to `true` (required)
   - `DISABLE_SUBSCRIPTIONS` - set to `true` (or remove if not needed)
   - `ENABLE_ACCOUNT_CREATION` - set to `false` (or remove if not needed)
   - `DISABLE_SIGNUPS` - set to `true` (or remove if not needed)
   - `ENABLE_INVITATIONS` - set to `false` (or remove if not needed)
   - `SMTP_MX_LOOKUPS` - set to `false`
   - `SMTP_VERIFY` - set to `false`
5. **For any empty boolean variable**: Either delete it OR set to `true`/`false`
6. **DO NOT** leave boolean variables as empty strings `""`
7. Redeploy the service after fixing

**Quick Fix Checklist**:
- [ ] Open Railway Dashboard → Variables
- [ ] Set `SMTP_HOST_SSL_ENABLED=false` (this is likely the culprit!)
- [ ] Check for any other variables with empty values
- [ ] Delete empty boolean variables OR set them to `true`/`false`
- [ ] Ensure `DISABLE_REGISTRATION=true` is set (required)
- [ ] Redeploy the Plausible service

### SMTP Configuration Notes
**Current Setup**: The configuration uses Resend's SMTP service:
- **Host**: `smtp.resend.com` (configured in `railway-plausible.json`)
- **Port**: `587` (STARTTLS, configured in `railway-plausible.json`)
- **Username**: `resend` (configured in `railway-plausible.json`)
- **Password**: Uses `RESEND_API_KEY` environment variable

**If you need to change SMTP settings**:
1. Edit `railway-plausible.json` 
2. Update `SMTP_HOST_ADDR`, `SMTP_HOST_PORT`, `SMTP_USER_NAME`, and `SMTP_USER_PASSWORD`
3. For port 587 (STARTTLS): `SMTP_HOST_SSL_ENABLED=false`
4. For port 465 (SSL): `SMTP_HOST_SSL_ENABLED=true`
5. Redeploy the service

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
