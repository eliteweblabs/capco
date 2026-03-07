# Disable Supabase Authentication Emails

## 🎯 Goal

Disable Supabase's built-in authentication emails and handle them with Resend instead.

## 🛠 Steps to Configure

### 1. Supabase Dashboard Settings

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication → Settings**
3. **Email Settings Section:**
   - ✅ **Disable "Enable email confirmations"**
   - ✅ **Disable "Enable email change confirmations"**
   - ✅ **Disable "Enable password recovery emails"**

### 2. Alternative: Custom SMTP (Optional)

If you want to keep some Supabase emails but use Resend's SMTP:

1. **In Supabase Dashboard → Authentication → Settings**
2. **SMTP Settings:**
   - **Host**: `smtp.resend.com`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: `resend`
   - **Password**: `your-resend-api-key`
   - **Sender Email**: `your-verified-email@yourdomain.com`

### 3. Environment Variables

Make sure these are set in your `.env`:

```bash
# Resend Configuration (already configured)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@RAILWAY_PUBLIC_DOMAIN
FROM_NAME=CAPCO Design Group

# Disable Supabase email confirmations
SUPABASE_AUTH_EMAIL_DISABLED=true
```

## ✅ What This Achieves

- **No duplicate emails** from Supabase
- **All auth emails** handled by your custom system
- **Consistent branding** and templates
- **Better tracking** and analytics
- **More reliable delivery**
