# Deploy Campfire Chat to Railway

## 🚀 Quick Setup Guide

### Step 1: Create Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `astro-supabase-main` repository
5. Name it: `capco-campfire-chat`

### Step 2: Configure Services
Railway will automatically detect the `railway-campfire.json` file and create the services.

**Note**: The Docker image `campfirechatapp/campfire:latest` is a placeholder. Verify the correct Docker image for Campfire Chat and update `railway-campfire.json` if different. If Campfire Chat is a SaaS service, you may need to use their API instead of self-hosting.

### Step 3: Set Environment Variables
In your Railway project dashboard, go to Variables and add:

```bash
# Database
CAMPFIRE_DB_PASSWORD=your_secure_password_here
CAMPFIRE_REDIS_PASSWORD=your_redis_password_here

# Campfire Configuration  
CAMPFIRE_SECRET_KEY=your_secret_key_here
CAMPFIRE_BASE_URL=https://capco-campfire-chat.railway.app

# SMTP Configuration (for email notifications)
CAMPFIRE_SMTP_HOST=smtp.resend.com
CAMPFIRE_SMTP_PORT=587
CAMPFIRE_SMTP_USER=resend
CAMPFIRE_SMTP_PASSWORD=your_resend_api_key_here
CAMPFIRE_FROM_EMAIL=noreply@capcofire.com

# Registration Settings
CAMPFIRE_DISABLE_REGISTRATION=true

# Admin User
CAMPFIRE_ADMIN_EMAIL=admin@capcofire.com
CAMPFIRE_ADMIN_PASSWORD=your_admin_password_here

# VAPID Keys for Web Push Notifications (Mobile/Desktop)
CAMPFIRE_VAPID_PUBLIC_KEY=your_vapid_public_key_here
CAMPFIRE_VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

### Step 4: Generate Secure Values
Run these commands to generate secure values:

```bash
# Generate database password
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32

# Generate secret key
openssl rand -base64 64

# Generate admin password
openssl rand -base64 32

# Generate VAPID keys for Web Push notifications
# Option 1: Using online generator
# Visit https://vapidkeys.com and click "Generate VAPID Keys"

# Option 2: Using command line (requires web-push package)
npm install -g web-push
web-push generate-vapid-keys
```

**Important**: VAPID keys are required for mobile/desktop push notifications. Save both the public and private keys securely.

### Step 5: Deploy
1. Railway will automatically deploy when you push to GitHub
2. Wait for all services to be healthy
3. Access your Campfire dashboard at the Railway URL

### Step 6: Configure Your Integration
1. Login to Campfire with admin credentials
2. Get your API key/token from the settings
3. Add it to your main app environment variables

### Step 7: Update Your Main App
Add these environment variables to your main app:

```bash
CAMPFIRE_URL=https://capco-campfire-chat.railway.app
CAMPFIRE_API_KEY=your_api_key_from_campfire
CAMPFIRE_WEBHOOK_SECRET=your_webhook_secret_here
```

## 🔧 Troubleshooting

### Services Not Starting
- Check that all environment variables are set
- Ensure database passwords match between services
- Check Railway logs for specific errors
- Verify PostgreSQL and Redis services are healthy

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check that PostgreSQL service is healthy and accessible
- Ensure Redis service is running
- Verify network connectivity between services

### Redis Connection Issues
- Check that `REDIS_URL` format is correct
- Verify Redis password matches `CAMPFIRE_REDIS_PASSWORD`
- Ensure Redis service is healthy before Campfire starts

### SMTP Configuration
- Verify SMTP credentials are correct
- Test SMTP connection outside of Campfire first
- Check that `CAMPFIRE_SMTP_PORT` is set to an integer (e.g., `587`)

### Admin Login Issues
- Verify `CAMPFIRE_ADMIN_EMAIL` and `CAMPFIRE_ADMIN_PASSWORD` are set
- Check that `CAMPFIRE_DISABLE_REGISTRATION` is set correctly
- Try resetting admin password in Railway variables and redeploying

### Push Notifications Not Working
- Verify `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set correctly
- Check that your site is served over HTTPS (required for Web Push)
- Test on supported browsers:
  - ✅ Chrome/Edge (Android & Desktop)
  - ✅ Firefox (Android & Desktop)
  - ✅ Safari 16.4+ (iOS 16.4+ & macOS)
  - ⚠️ Safari on older iOS versions may have limited support
- Users must grant notification permission when prompted
- Web Push works on mobile browsers, but for native iOS/Android apps, consider FCM/APNs

## 📊 Usage

Once deployed:
1. **Access Dashboard**: `https://capco-campfire-chat.railway.app`
2. **Login**: Use admin credentials set in environment variables
3. **Configure**: Set up rooms, channels, and integrations
4. **Get API Key**: Copy API key for your main app integration
5. **Integrate**: Add Campfire widget/API to your main app

## 🔄 Updates

To update Campfire:
1. Push changes to GitHub
2. Railway will automatically redeploy
3. Check Railway dashboard for deployment status

## 🔗 Integration with Main App

After deployment, integrate Campfire Chat into your Astro app:

### 1. Add Environment Variables
Add to your main app's Railway variables:
```bash
CAMPFIRE_URL=https://capco-campfire-chat.railway.app
CAMPFIRE_API_KEY=your_api_key_from_campfire_dashboard
```

### 2. Create Campfire Component
Create a component to embed or connect to Campfire Chat:
```astro
// src/components/common/CampfireChat.astro
---
const campfireUrl = import.meta.env.CAMPFIRE_URL;
const apiKey = import.meta.env.CAMPFIRE_API_KEY;
---

<div id="campfire-chat-widget">
  <!-- Campfire Chat Integration -->
</div>
```

### 3. Add to Layout
Include the component in your main layout or app component.

## 📝 Notes

- **Database**: PostgreSQL 15 for persistent storage
- **Cache**: Redis 7 for session management and caching
- **Port**: Campfire runs on port 3000 (Railway will expose it)
- **Dependencies**: Campfire depends on both database and Redis services
- **Registration**: Set `CAMPFIRE_DISABLE_REGISTRATION=true` to control access

