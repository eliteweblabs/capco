# Railway SSL/Domain Setup for capcofire.com

## Issue: "Not Secure" / HTTPS Not Working

If you're seeing a "Not Secure" warning, Railway's SSL certificate isn't properly configured for your custom domain.

## Solution: Configure Custom Domain in Railway

### Step 1: Add Custom Domain in Railway

1. **Go to Railway Dashboard**
   - Navigate to your project
   - Click on your **astro-app** service

2. **Configure Custom Domain**
   - Go to **Settings** tab
   - Scroll to **Networking** section
   - Under **Custom Domain**, click **Add Domain**
   - Enter: `capcofire.com`
   - Railway will automatically provision an SSL certificate

3. **Wait for SSL Certificate**
   - Railway will automatically request a Let's Encrypt SSL certificate
   - This usually takes 1-5 minutes
   - Check the status in Railway dashboard

### Step 2: Configure DNS

Railway will provide DNS records you need to add:

1. **Get DNS Records from Railway**
   - After adding the domain, Railway will show required DNS records
   - Usually a CNAME record pointing to Railway's domain

2. **Add DNS Records**
   - Go to your domain registrar (where you bought capcofire.com)
   - Add the CNAME record Railway provides
   - Example: `capcofire.com` → `your-app.up.railway.app`

3. **Wait for DNS Propagation**
   - DNS changes can take up to 48 hours (usually much faster)
   - Check propagation: https://dnschecker.org

### Step 3: Verify SSL Certificate

After DNS propagates and Railway provisions SSL:

1. **Check Railway Dashboard**
   - Domain should show "Active" with a green checkmark
   - SSL certificate status should be "Valid"

2. **Test HTTPS**
   - Visit `https://capcofire.com`
   - Should show secure padlock icon
   - No "Not Secure" warning

## Alternative: Use Railway's Auto-Generated Domain

If custom domain setup is complex, you can use Railway's auto-generated domain:

1. **Generate Public Domain**
   - Railway Dashboard → Service → Settings → Networking
   - Click **Generate Domain**
   - This gives you: `your-app.up.railway.app`
   - Railway automatically provides SSL for `.railway.app` domains

2. **Update Environment Variables**
   - Set `RAILWAY_PUBLIC_DOMAIN` to the generated domain
   - Redeploy

## Troubleshooting

### SSL Certificate Not Provisioning

**Symptoms:**
- Domain shows "Pending" in Railway
- SSL certificate status is "Pending" or "Failed"

**Solutions:**
1. **Check DNS Records**
   - Verify CNAME record is correct
   - Use `dig capcofire.com` or `nslookup capcofire.com` to verify

2. **Wait Longer**
   - SSL provisioning can take up to 10 minutes
   - Check Railway logs for SSL-related errors

3. **Remove and Re-add Domain**
   - Sometimes removing and re-adding helps
   - Railway Dashboard → Service → Settings → Networking
   - Remove domain, wait 5 minutes, add again

### Mixed Content Warnings

**Symptoms:**
- Site loads but shows "Not Secure" for some resources
- Browser console shows mixed content warnings

**Solutions:**
1. **Ensure All URLs Use HTTPS**
   - Check `astro.config.mjs` - `site` should use `https://`
   - Check all API calls use `https://`
   - Check image URLs use `https://`

2. **Update Environment Variables**
   - `RAILWAY_PUBLIC_DOMAIN` should NOT include `https://` (Railway adds it)
   - But `site` in `astro.config.mjs` should include `https://`

### Domain Not Resolving

**Symptoms:**
- Browser can't connect to capcofire.com
- DNS lookup fails

**Solutions:**
1. **Verify DNS Records**
   ```bash
   dig capcofire.com
   nslookup capcofire.com
   ```
   Should point to Railway's domain

2. **Check Domain Registrar**
   - Ensure DNS is managed correctly
   - Some registrars require specific DNS server settings

## Current Configuration Check

Based on your `astro.config.mjs`:
- `site` is set to: `https://${env.RAILWAY_PUBLIC_DOMAIN || "capcofire.com"}`
- This is correct - it will use HTTPS

**What to verify:**
1. `RAILWAY_PUBLIC_DOMAIN` in Railway should be: `capcofire.com` (without https://)
2. Custom domain should be added in Railway dashboard
3. DNS should point to Railway
4. SSL certificate should be provisioned

## Quick Fix Checklist

- [ ] Custom domain added in Railway dashboard
- [ ] DNS CNAME record added at domain registrar
- [ ] DNS propagated (check with dnschecker.org)
- [ ] SSL certificate provisioned (check Railway dashboard)
- [ ] `RAILWAY_PUBLIC_DOMAIN` set to `capcofire.com` (no https://)
- [ ] Service redeployed after domain configuration

## Need Help?

If SSL still doesn't work after following these steps:
1. Check Railway deployment logs for SSL-related errors
2. Verify DNS records are correct
3. Try using Railway's auto-generated domain first to test
4. Contact Railway support if certificate provisioning fails

