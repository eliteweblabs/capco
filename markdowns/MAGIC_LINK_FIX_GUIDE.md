# Magic Link Fix Guide

## Problem Summary

The magic link authentication system had several issues:

1. **Wrong Redirect URL**: The authorized redirect URL in Supabase was set to `/api/auth/callback` (for OAuth), but magic links need to redirect to `/api/auth/verify`
2. **Incorrect Link Generation**: Magic links were being generated with wrong redirect URLs
3. **Missing Redirect Parameter**: The verify endpoint didn't support custom redirect paths
4. **All Emails Converted to Magic Links**: Regular notification emails to admins were being converted to magic links

## What Was Fixed

### 1. `/src/pages/api/email-delivery.ts`

- **Magic Link Generation Logic**: Now only generates magic links when `emailType === "magic_link"`
- **Proper Redirect URL**: Magic links now redirect to `/api/auth/verify?redirect=/dashboard`
- **Regular Link Support**: Non-magic-link emails now get regular absolute URLs
- **Better Logging**: Added more detailed logging for debugging magic link generation

### 2. `/src/pages/api/auth/verify.ts`

- **Custom Redirect Support**: Now accepts a `redirect` query parameter to customize where users go after verification
- **Better Logging**: Added emoji-prefixed logs for easier debugging (`🔐 [VERIFY]`)
- **More Info Logged**: Logs full URL, redirect path, and user email for troubleshooting

### 3. `/src/pages/api/auth/register.ts`

- **Welcome Email**: Uses `emailType: "magic_link"` with `buttonLink: "/dashboard"` (will be converted to magic link)
- **Admin Notification**: Uses `emailType: "notification"` with regular link to `/users` (NOT a magic link)

### 4. `/src/pages/api/create-user.ts`

- **Welcome Email**: Uses `emailType: "magic_link"` with `buttonLink: "/dashboard"` (will be converted to magic link)
- **Admin Notification**: Uses `emailType: "notification"` with regular link to `/users` (NOT a magic link)

## Required Supabase Configuration

### IMPORTANT: Update Authorized Redirect URLs

You need to update your Supabase project settings:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add:
   ```
   http://localhost:4321/api/auth/verify
   ```
4. For production, also add:
   ```
   https://yourdomain.com/api/auth/verify
   ```

### Keep Existing OAuth Callback URL

Keep your existing `/api/auth/callback` URL for OAuth flows. Both URLs can coexist:

- `/api/auth/callback` - for OAuth (Google, GitHub, etc.)
- `/api/auth/verify` - for magic links and email verification

## How Magic Links Now Work

### The Flow:

1. **User Registration/Creation**:

   ```
   User submits form → API creates user → email-delivery.ts called
   ```

2. **Magic Link Generation** (in `email-delivery.ts`):

   ```typescript
   const redirectUrl = `${baseUrl}/api/auth/verify?redirect=/dashboard`;

   const { data } = await supabaseAdmin.auth.admin.generateLink({
     type: "magiclink",
     email: userEmail,
     options: {
       redirectTo: redirectUrl,
     },
   });

   // Email button gets: data.properties.action_link
   ```

3. **User Clicks Email Link**:

   ```
   Magic link URL → Supabase verifies → Redirects to:
   /api/auth/verify?token_hash=xxx&type=magiclink&redirect=/dashboard
   ```

4. **Verification** (in `verify.ts`):

   ```typescript
   // Verify the token with Supabase
   await supabase.auth.verifyOtp({
     token_hash,
     type: "magiclink",
   });

   // Set auth cookies
   setAuthCookies(cookies, access_token, refresh_token);

   // Redirect to final destination
   redirect("/dashboard?message=welcome");
   ```

## Testing the Fix

### 1. Local Testing

First, update your `.env` file:

```bash
SITE_URL=http://localhost:4321
```

Then test:

```bash
# Start your dev server
npm run dev

# Register a new user or create a user via admin panel
# Check the console logs for:
# 🔗 [EMAIL-DELIVERY] Magic link configuration
# 🔗 [EMAIL-DELIVERY] Magic link generated successfully
```

### 2. Check Email

Open the email sent to the user. The button should contain a link like:

```
https://your-project.supabase.co/auth/v1/verify?token=...&type=magiclink&redirect_to=http://localhost:4321/api/auth/verify?redirect=%2Fdashboard
```

### 3. Click the Link

When you click the magic link:

1. Supabase verifies the token
2. Redirects to `/api/auth/verify?token_hash=xxx&type=magiclink&redirect=/dashboard`
3. Your app verifies with Supabase
4. Sets auth cookies
5. Redirects to `/dashboard?message=welcome`

### 4. Check Console Logs

You should see logs like:

```
🔐 [VERIFY] Email verification started
🔐 [VERIFY] Verification params: { token_hash: 'present', type: 'magiclink', redirectPath: '/dashboard' }
🔐 [VERIFY] Attempting magiclink verification with token hash...
🔐 [VERIFY] Verification successful: { hasSession: true, userEmail: 'user@example.com' }
🔐 [VERIFY] Setting auth cookies for verified user: user@example.com
🔐 [VERIFY] Email verification complete, redirecting to: /dashboard
```

## Common Issues & Solutions

### Issue: "Invalid verification parameters"

**Solution**: Check that your Supabase redirect URL is set to `/api/auth/verify` (not `/api/auth/callback`)

### Issue: "Magic link expired"

**Solution**: Magic links expire after 1 hour by default. Generate a new one.

### Issue: "PKCE error" or "code verifier"

**Solution**: This is for OAuth, not magic links. Make sure you're using the magic link flow, not OAuth.

### Issue: Magic link goes to wrong domain

**Solution**: Check your `SITE_URL` environment variable matches your current environment (localhost for dev, your domain for production)

### Issue: Admin notifications have magic links

**Solution**: Make sure admin notification emails use `emailType: "notification"` not `"magic_link"`

## Environment Variables Checklist

Make sure you have these set in your `.env` file:

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for generateLink

# Email
EMAIL_PROVIDER=resend
EMAIL_API_KEY=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Company Name

# Site URL (CRITICAL for magic links)
SITE_URL=http://localhost:4321  # For development
# SITE_URL=https://yourdomain.com  # For production
```

## Production Deployment

When deploying to production:

1. Update `.env` or environment variables:

   ```bash
   SITE_URL=https://yourdomain.com
   ```

2. Update Supabase redirect URLs to include:

   ```
   https://yourdomain.com/api/auth/verify
   ```

3. Test magic links in production environment

4. Monitor logs for any issues

## Additional Notes

### Why `/api/auth/verify` instead of `/api/auth/callback`?

- `/api/auth/callback` is designed for OAuth flows (Google, GitHub, etc.) which use PKCE and code exchange
- `/api/auth/verify` is designed for email verification and magic links which use token_hash
- They handle different authentication methods and parameters

### Magic Link Security

- Magic links expire after 1 hour by default
- Each magic link can only be used once
- Magic links are tied to a specific email address
- The `SUPABASE_SERVICE_ROLE_KEY` is required to generate magic links server-side

### Debugging Tips

1. Enable verbose logging by checking console output with emoji prefixes:
   - `🔗 [EMAIL-DELIVERY]` - Magic link generation
   - `🔐 [VERIFY]` - Verification process
   - `📧 [EMAIL-DELIVERY]` - Email sending

2. Check the full URL in browser address bar when magic link redirects

3. Inspect the email HTML source to see the actual magic link URL

4. Check Supabase Auth logs in your Supabase dashboard

## Summary

The fixes ensure:
✅ Magic links are only generated for authentication emails  
✅ Magic links redirect to the correct verification endpoint  
✅ Verification endpoint properly handles magic link tokens  
✅ Users can be redirected to custom destinations after verification  
✅ Admin notifications use regular links, not magic links  
✅ All logs are clear and helpful for debugging

**Next Step**: Update your Supabase authorized redirect URLs as described above, then test the magic link flow!
