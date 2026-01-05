# Certificate Setup Instructions

## Quick Setup Steps

### Step 1: Export Certificate from Keychain Access

1. **Open Keychain Access** (should already be open)
2. In the left sidebar, select **"login"** keychain
3. Click **"My Certificates"** (or search for "IdenTrust")
4. Find your **IdenTrust** certificate (or "Jason M Kahan")
5. **Right-click** the certificate → **"Export 'IdenTrust'..."**
   - Or select it and go to **File → Export Items**
6. Choose **"Personal Information Exchange (.p12)"** format
7. **Save** it to: `certs/identrust.p12` in your project root
   - Navigate to: `/Users/4rgd/Astro/astro-supabase-main/certs/`
   - File name: `identrust.p12`
8. **Set a password** when prompted (remember this - you'll need it!)
9. macOS may ask for your admin password to export the private key

### Step 2: Set Environment Variables

Add these to your `.env` file:

```bash
CERT_PATH=./certs/identrust.p12
CERT_PASSWORD=your_certificate_password_here
```

**Important:** Replace `your_certificate_password_here` with the password you set when exporting!

### Step 3: Verify Setup

After exporting and setting environment variables:

1. Restart your dev server (if running)
2. Try uploading a PDF again at `/admin/certify-pdf`

## Troubleshooting

### Certificate Not Found
- Make sure the file is saved as `certs/identrust.p12` (not `certs/identrust.p12.p12`)
- Check file permissions: `chmod 600 certs/identrust.p12`
- Verify the path in `.env` matches: `CERT_PATH=./certs/identrust.p12`

### Wrong Password
- Make sure `CERT_PASSWORD` in `.env` matches the password you set when exporting
- Check for extra spaces or special characters

### Keychain Export Issues
- If you can't export, the certificate might be hardware-bound (non-exportable)
- In that case, you may need to request a software certificate from IdenTrust

## File Structure

After setup, your project should have:

```
astro-supabase-main/
├── certs/
│   └── identrust.p12          ← Your certificate file (NEVER commit this!)
├── .env                       ← Contains CERT_PATH and CERT_PASSWORD
└── ...
```

## Security Notes

- ✅ The `certs/` directory is already in `.gitignore`
- ✅ Certificate files (`.p12`, `.pfx`, etc.) are ignored
- ✅ Never commit your certificate or password to Git
- ✅ Keep your `.env` file secure and never commit it

