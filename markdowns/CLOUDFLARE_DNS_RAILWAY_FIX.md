# Cloudflare DNS Resolution Error Fix

## Problem: Error 1001 - DNS Resolution Error

You're seeing Cloudflare Error 1001, which means Cloudflare can't resolve `capcofire.com` to your Railway backend.

## Root Cause

The domain is using Cloudflare, but Cloudflare's DNS isn't properly configured to point to Railway.

## Solution

### Option 1: Use Cloudflare DNS (Recommended if using Cloudflare)

1. **Go to Cloudflare Dashboard**
   - Login at https://dash.cloudflare.com
   - Select your domain `capcofire.com`

2. **Check DNS Records**
   - Go to **DNS** → **Records**
   - Look for an A or CNAME record for `capcofire.com`

3. **Get Railway's IP/Domain**
   - Go to Railway Dashboard → Your Project → **astro-app** service
   - Settings → **Networking**
   - Note the **Public Domain** (e.g., `your-app.up.railway.app`)
   - Or get the IP address if Railway provides one

4. **Update Cloudflare DNS**
   - **If using CNAME:**
     - Type: `CNAME`
     - Name: `@` (or `capcofire.com`)
     - Target: `your-app.up.railway.app` (Railway's domain)
     - Proxy status: **Proxied** (orange cloud) ✅
   
   - **If using A record:**
     - Type: `A`
     - Name: `@` (or `capcofire.com`)
     - Target: Railway's IP address
     - Proxy status: **Proxied** (orange cloud) ✅

5. **Important: Enable Proxy (Orange Cloud)**
   - Make sure the proxy toggle is ON (orange cloud)
   - This allows Cloudflare to handle SSL and proxy to Railway
   - If it's grey (DNS only), Cloudflare won't proxy

### Option 2: Bypass Cloudflare (Use Railway Directly)

If you don't need Cloudflare, point DNS directly to Railway:

1. **Get Railway Domain**
   - Railway Dashboard → Service → Settings → Networking
   - Copy the public domain (e.g., `your-app.up.railway.app`)

2. **Update DNS at Your Registrar**
   - Go to your domain registrar (where you bought capcofire.com)
   - Remove Cloudflare nameservers
   - Add CNAME record:
     - Name: `@` or `capcofire.com`
     - Value: `your-app.up.railway.app`

3. **Remove Cloudflare**
   - This bypasses Cloudflare entirely
   - Railway will handle SSL directly

### Option 3: Fix Cloudflare Proxy Settings

If Cloudflare is proxying but misconfigured:

1. **Check SSL/TLS Settings**
   - Cloudflare Dashboard → SSL/TLS
   - Set encryption mode to **Full** or **Full (strict)**
   - This ensures Cloudflare → Railway connection is encrypted

2. **Check Origin Server**
   - Cloudflare Dashboard → SSL/TLS → Origin Server
   - Make sure Railway's certificate is valid
   - Or use "Full" mode (not strict) if Railway uses self-signed

3. **Verify DNS Records**
   - Make sure DNS records are correct
   - Check that they point to Railway's domain/IP

## Quick Diagnostic Steps

### 1. Check Current DNS Records

```bash
# Check what DNS records exist
dig capcofire.com ANY

# Check what Cloudflare sees
dig capcofire.com @1.1.1.1
```

### 2. Check Railway Domain

- Railway Dashboard → Service → Settings → Networking
- Note the **Public Domain** Railway provides
- This is what DNS should point to

### 3. Verify Cloudflare Configuration

- Cloudflare Dashboard → DNS → Records
- Ensure there's a record for `capcofire.com` or `@`
- Ensure it points to Railway's domain
- Ensure proxy is enabled (orange cloud)

## Common Issues

### Issue 1: DNS Points to Wrong Location
**Symptom:** DNS resolves but to wrong IP/domain  
**Fix:** Update DNS records in Cloudflare to point to Railway

### Issue 2: Proxy Disabled (Grey Cloud)
**Symptom:** DNS works but Cloudflare isn't proxying  
**Fix:** Enable proxy (orange cloud) in Cloudflare DNS settings

### Issue 3: SSL Mode Mismatch
**Symptom:** Connection works but SSL errors  
**Fix:** Set Cloudflare SSL/TLS mode to "Full" (not strict)

### Issue 4: Railway Domain Changed
**Symptom:** DNS points to old Railway domain  
**Fix:** Update DNS records with new Railway domain

## Recommended Configuration

**If Using Cloudflare:**
```
DNS Record:
- Type: CNAME
- Name: @ (or capcofire.com)
- Target: your-app.up.railway.app
- Proxy: ON (orange cloud) ✅
- TTL: Auto

Cloudflare SSL/TLS:
- Encryption mode: Full
- Always Use HTTPS: ON
```

**If NOT Using Cloudflare:**
```
DNS Record (at registrar):
- Type: CNAME
- Name: @
- Value: your-app.up.railway.app
- TTL: 3600

Railway:
- Custom domain: capcofire.com
- SSL: Automatic (Railway provides)
```

## Next Steps

1. **Check Cloudflare Dashboard** - Verify DNS records
2. **Check Railway Dashboard** - Get current public domain
3. **Update DNS** - Point to Railway correctly
4. **Wait for Propagation** - DNS changes take 5-60 minutes
5. **Test** - Visit https://capcofire.com

## Need Help?

If still not working:
1. Share what DNS records you see in Cloudflare
2. Share Railway's public domain
3. Check if Cloudflare proxy is enabled (orange vs grey cloud)

