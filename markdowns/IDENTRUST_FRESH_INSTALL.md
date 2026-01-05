# IdenTrust Certificate Fresh Installation Guide

## Step 1: Remove Old Certificates

Run the cleanup script:
```bash
./scripts/remove-duplicate-certs.sh
```

Or manually:
1. Open Keychain Access
2. Search for "Jason M Kahan"
3. Delete both certificates (right-click → Delete)
4. Delete both private keys associated with them
5. Empty Keychain Access trash

## Step 2: Get New Certificate from IdenTrust

1. **Contact IdenTrust** or log into your IdenTrust account
2. **Request a new certificate** (or re-download existing one)
3. **Download the certificate file** (.p12 or .pfx format)
4. **Note the password** - you'll need it for export

## Step 3: Install Certificate in Keychain

1. **Double-click the downloaded certificate file**
2. macOS will prompt you to install it
3. **Enter the password** when prompted
4. **Select "login" keychain** (not System)
5. Click "Add"

## Step 4: Verify Certificate Chain

1. Open Keychain Access
2. Find your new "Jason M Kahan" certificate
3. **Double-click it** to open details
4. **Check the certificate chain** - you should see:
   - Your certificate (Jason M Kahan)
   - Intermediate CA (IGC CA 2)
   - Root CA (IdenTrust Global Common Root CA 1)
5. **Verify the root CA is trusted**:
   - If it shows a red X, you need to trust it (see below)

## Step 5: Trust the Root CA (if needed)

1. In Keychain Access, search for **"IdenTrust Global Common Root CA 1"**
2. **Double-click it**
3. Expand **"Trust"** section
4. Set **"When using this certificate"** to **"Always Trust"**
5. Close and enter your password

## Step 6: Export Certificate with Full Chain

**CRITICAL: Include all certificates in the chain**

1. In Keychain Access, find your **"Jason M Kahan"** certificate
2. **Right-click** → **"Export 'Jason M Kahan'..."**
3. Choose **"Personal Information Exchange (.p12)"** format
4. **IMPORTANT:** Check **"Include all certificates"** or **"Include certificates in chain"**
5. Save to: `certs/identrust.p12`
6. **Set a password** (remember this!)
7. macOS may ask for your admin password to export the private key

## Step 7: Update Environment Variables

Update your `.env` file:

```bash
CERT_PATH=./certs/identrust.p12
CERT_PASSWORD=your_new_password_here
```

Or for Railway (base64):
```bash
# Generate base64
base64 certs/identrust.p12

# Add to Railway:
CERT_BASE64=<paste_base64_here>
CERT_PASSWORD=your_new_password_here
```

## Step 8: Test the Certificate

Run the certificate test:
```bash
npm run test:cert
```

You should see:
- ✅ Certificate loaded successfully
- ✅ Certificate is valid
- ✅ Multiple certificates found (full chain present)
- ✅ P12Signer initialized successfully
- ✅ Signature created successfully

## Troubleshooting

### Certificate still shows invalid
- Make sure root CA is trusted (Step 5)
- Verify certificate chain is complete (Step 4)
- Check certificate hasn't expired

### Only one certificate in P12
- Re-export with "Include all certificates" checked
- Make sure intermediate CA is in Keychain

### Can't export private key
- Certificate might be hardware-bound (non-exportable)
- Contact IdenTrust for a software certificate

## Important Notes

- **Never commit** `certs/identrust.p12` to Git
- **Keep the password secure** - store in environment variables only
- **Backup the certificate** - you'll need it for production deployment
- **Test locally first** before deploying to Railway


