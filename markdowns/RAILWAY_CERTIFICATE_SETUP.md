# Railway Certificate Setup

## Quick Setup for Railway Deployment

### Step 1: Encode Certificate to Base64

On your local machine, run:

```bash
base64 certs/identrust.p12
```

This will output a long base64 string. Copy the entire output.

### Step 2: Add to Railway Environment Variables

1. Go to your Railway project dashboard
2. Navigate to **Variables** tab
3. Add these two environment variables:

   **CERT_BASE64**
   ```
   (paste the entire base64 string from step 1)
   ```

   **CERT_PASSWORD**
   ```
   (your certificate password - the one you set when exporting)
   ```

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger auto-deploy

## Verification

After deployment, check the logs for:
```
🔐 [CERT-LOADER] Loading certificate from base64 environment variable...
✅ [CERT-LOADER] Certificate loaded from base64: [Your Name]
```

## Alternative: Using CERT_PATH

If you prefer to use a file path (requires Railway volumes or file upload):

1. Upload `certs/identrust.p12` to Railway's file system
2. Set environment variables:
   ```
   CERT_PATH=/path/to/identrust.p12
   CERT_PASSWORD=your_password
   ```

**Note:** Base64 encoding (CERT_BASE64) is recommended for Railway as it's simpler and doesn't require file system access.

## Security Notes

- ✅ Railway environment variables are encrypted at rest
- ✅ CERT_BASE64 contains your encrypted certificate (still secure)
- ✅ Never commit the base64 string to Git
- ✅ The certificate loader will automatically try base64 first, then file paths

