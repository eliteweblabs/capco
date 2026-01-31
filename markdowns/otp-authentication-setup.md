# OTP (One-Time Password) Authentication Setup

This document describes the OTP authentication system implemented for passwordless login.

## Overview

The OTP authentication system allows users to sign in using a one-time password sent to their email instead of using a traditional password. This provides a more secure and user-friendly authentication method.

## Features

- **Passwordless Login**: Users can sign in without remembering a password
- **Email-based OTP**: 6-digit verification codes sent via email
- **Automatic Session Management**: Seamless authentication with session cookies
- **Resend Functionality**: Users can request a new code if needed
- **Security Logging**: All OTP requests and verifications are logged for security audit

## Implementation

### API Routes

#### 1. `/api/auth/send-otp` (POST)

Sends a one-time password to the user's email.

**Request Body:**

```json
{
  "email": "user@example.com",
  "type": "magiclink" // optional, default: "magiclink"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "OTP sent successfully. Please check your email."
}
```

**Response (Error):**

```json
{
  "error": "Failed to send OTP",
  "details": "Error message details"
}
```

#### 2. `/api/auth/verify-otp` (POST)

Verifies the OTP code and authenticates the user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "token": "123456",
  "type": "email" // optional, default: "email"
}
```

**Response (Success):**

```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "created_at": "2026-01-30T..."
  },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": "..."
  },
  "message": "OTP verified successfully"
}
```

**Response (Error):**

```json
{
  "error": "Invalid or expired OTP",
  "details": "Error message details"
}
```

### Components

#### 1. `OTPForm.astro`

The main OTP authentication form component with two states:

- **Request Form**: User enters their email to receive OTP
- **Verification Form**: User enters the 6-digit code

**Features:**

- Auto-format input (numbers only)
- Email validation
- Resend functionality
- Back navigation
- Success/error notifications

#### 2. `otp-login.astro`

The standalone OTP login page that uses the OTPForm component.

**URL:** `/auth/otp-login`

### User Flow

1. **User visits OTP login page** (`/auth/otp-login`)
2. **User enters email address** and clicks "Send Code"
3. **System sends 6-digit OTP** to the email via Supabase
4. **User receives email** with verification code
5. **User enters code** in verification form
6. **System verifies code** and creates session
7. **User is redirected** to dashboard

### Integration Points

#### Login Page Update

The main login page (`/auth/login`) now includes a link to the OTP login option:

```astro
<a href="/auth/otp-login"> Sign in with OTP (passwordless) </a>
```

## Supabase Configuration

### Email Templates

To customize the OTP email template in Supabase:

1. Go to **Authentication > Email Templates** in Supabase Dashboard
2. Select **Magic Link** template
3. Customize the template as needed:

```html
<h2>Your verification code</h2>
<p>Use this code to sign in:</p>
<h1 style="font-size: 32px; font-family: monospace;">{{ .Token }}</h1>
<p>This code expires in 1 hour.</p>
```

### Email Provider Configuration

The system uses **Resend** as the email provider (configured in `.env`):

```env
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_...
FROM_EMAIL=noreply@capcofire.com
FROM_NAME='CAPCO Design Group'
```

Supabase will use these settings to send OTP emails.

## Security Features

1. **Token Expiration**: OTP codes expire after a set time (default: 1 hour)
2. **Rate Limiting**: Supabase provides built-in rate limiting for OTP requests
3. **Audit Logging**: All OTP sends and verifications are logged via `SimpleProjectLogger`
4. **Session Cookies**: Secure HTTP-only cookies for session management
5. **Email Validation**: Server-side email validation before sending OTP

## Testing

### Manual Testing

1. **Request OTP:**

   ```bash
   curl -X POST https://capcofire.com/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. **Verify OTP:**
   ```bash
   curl -X POST https://capcofire.com/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "token": "123456"}'
   ```

### Browser Testing

1. Navigate to `/auth/otp-login`
2. Enter your email address
3. Check your email for the OTP code
4. Enter the code and verify
5. Should redirect to dashboard upon success

## Troubleshooting

### OTP Email Not Received

1. **Check Spam Folder**: OTP emails might be filtered as spam
2. **Verify Email Provider**: Ensure Resend API key is valid in `.env`
3. **Check Supabase Logs**: View email logs in Supabase Dashboard
4. **Rate Limiting**: User might have exceeded rate limits (wait and retry)

### Invalid OTP Error

1. **Code Expired**: OTP codes expire after 1 hour
2. **Wrong Code**: Ensure the code is entered correctly
3. **Already Used**: Each code can only be used once
4. **Email Mismatch**: Email must match the one used to request OTP

### Session Not Created

1. **Cookie Issues**: Check browser cookie settings
2. **CORS Issues**: Ensure proper CORS configuration
3. **Check Logs**: Review console logs and server logs

## Future Enhancements

- [ ] SMS-based OTP (requires phone number collection)
- [ ] Time-based OTP countdown display
- [ ] Multiple verification methods (email + SMS)
- [ ] Remember device functionality
- [ ] Custom OTP code length configuration
- [ ] Analytics dashboard for OTP usage

## Related Files

- `/src/pages/api/auth/send-otp.ts` - API route for sending OTP
- `/src/pages/api/auth/verify-otp.ts` - API route for verifying OTP
- `/src/components/form/OTPForm.astro` - OTP form component
- `/src/pages/auth/otp-login.astro` - OTP login page
- `/src/components/form/AuthForm.astro` - Updated with OTP link

## Support

For issues or questions about OTP authentication:

1. Check Supabase documentation: https://supabase.com/docs/guides/auth/auth-otp
2. Review application logs in SimpleProjectLogger
3. Check email delivery logs in Resend dashboard
