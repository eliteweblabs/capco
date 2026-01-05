# Fix Cal.com Docker Image Error on Railway

## Problem
The Docker image `calcom/cal.com:latest` cannot be found for architecture `amd64` on Railway.

## Solution
Switch from Docker image to building from source using NIXPACKS.

## Option 1: Update via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Navigate to your Cal.com project: "CAPCO Design Group"
   - Select the "Cal.com Web App" service

2. **Update Service Configuration**
   - Click on the service → **Settings** tab
   - Scroll to **Source** section
   - Change from **Docker Image** to **GitHub Repo**
   - Set:
     - **Repository**: `calcom/cal.com`
     - **Branch**: `main`
   - Set **Build Command**: (leave empty, NIXPACKS will auto-detect)
   - Set **Start Command**: `npm run start`

3. **Update Environment Variables** (if needed)
   - Make sure these are set:
     - `NODE_ENV=production`
     - `DATABASE_URL=postgres://calcom:${{CALCOM_DB_PASSWORD}}@calcom-db:5432/calcom`
     - `NEXTAUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`
     - `NEXTAUTH_SECRET=${{CALCOM_NEXTAUTH_SECRET}}`
     - `CALENDSO_ENCRYPTION_KEY=${{CALCOM_ENCRYPTION_KEY}}`
     - `NEXT_PUBLIC_WEBAPP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`
     - `NEXT_PUBLIC_WEBSITE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`
     - `EMAIL_SERVER=smtp://resend:${{RESEND_API_KEY}}@smtp.resend.com:587`
     - `EMAIL_FROM=${{EMAIL_FROM}}`
     - `EMAIL_FROM_NAME=${{EMAIL_FROM_NAME}}`
     - `PORT=3000`

4. **Redeploy**
   - Click **Deploy** or **Redeploy** button
   - The build will take 10-15 minutes (building from source)

## Option 2: Delete and Recreate Service

If updating doesn't work, you can delete and recreate:

1. **Delete the Cal.com Web App service**
   - Go to service → Settings → Delete Service
   - **Keep the database service** (calcom-db)

2. **Create new service**
   - Click **+ New** → **GitHub Repo**
   - Select `calcom/cal.com` repository
   - Branch: `main`
   - Railway will auto-detect it's a Next.js app

3. **Configure the service**
   - Set environment variables (see list above)
   - Set start command: `npm run start`
   - Link to the existing database service

4. **Deploy**
   - Railway will automatically start building

## Option 3: Use CLI Script

Run the update script:

```bash
./update-calcom-deployment.sh
```

This will:
- Link to your Cal.com project
- Use `railway-calcom.json` configuration
- Trigger a new deployment

**Note**: If the service was created via dashboard, you may still need to update it manually in the dashboard (Option 1).

## Verification

After deployment:
1. Check build logs in Railway dashboard
2. Wait for build to complete (10-15 minutes)
3. Verify the service is running
4. Test Cal.com at your Railway domain

## Why This Works

- **Docker Image Issue**: The `calcom/cal.com:latest` image doesn't exist or doesn't support `amd64` architecture
- **NIXPACKS Solution**: Building from source ensures compatibility and gets the latest code
- **Trade-off**: Longer build time but more reliable deployment

