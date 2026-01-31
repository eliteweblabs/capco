# OTP Authentication - Quick Reference

## 🚀 Quick Start

### For Users

1. Navigate to `/auth/otp-login` or click "Sign in with OTP (passwordless)" on login page
2. Enter your email address
3. Check your email for a 6-digit code
4. Enter the code to sign in

### For Developers

**Send OTP:**

```typescript
const response = await fetch("/api/auth/send-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com" }),
});
```

**Verify OTP:**

```typescript
const response = await fetch("/api/auth/verify-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    token: "123456",
  }),
});
```

## 📁 File Structure

```
src/
├── pages/
│   ├── auth/
│   │   └── otp-login.astro              # OTP login page
│   └── api/auth/
│       ├── send-otp.ts                  # API: Send OTP
│       └── verify-otp.ts                # API: Verify OTP
└── components/form/
    └── OTPForm.astro                    # OTP form component

scripts/
├── verify-otp-setup.sh                  # Verify installation
└── test-otp-flow.sh                     # Test OTP flow

markdowns/
└── otp-authentication-setup.md          # Full documentation

sql-queriers/
└── otp-analytics-setup.sql              # Optional analytics
```

## 🔧 Setup Checklist

- [x] API routes created (`send-otp.ts`, `verify-otp.ts`)
- [x] OTP form component created (`OTPForm.astro`)
- [x] OTP login page created (`otp-login.astro`)
- [x] Login page updated with OTP link
- [ ] Supabase email template configured
- [ ] Test OTP flow
- [ ] Deploy to production

## 🧪 Testing

### Verify Setup

```bash
./scripts/verify-otp-setup.sh
```

### Test OTP Flow

```bash
./scripts/test-otp-flow.sh
# Or with custom URL and email:
./scripts/test-otp-flow.sh https://capcofire.com your@email.com
```

### Manual Test

1. Go to `/auth/otp-login`
2. Enter your email
3. Check email for code
4. Enter code and verify

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Supabase (already configured)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx

# Email Provider (already configured)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_xxx
FROM_EMAIL=noreply@capcofire.com
FROM_NAME='CAPCO Design Group'
```

### Supabase Email Template

1. Go to Supabase Dashboard
2. Navigate to **Authentication > Email Templates**
3. Select **Magic Link** template
4. Customize as needed

Example template:

```html
<h2>Your verification code</h2>
<p>Use this code to sign in to {{ .SiteURL }}:</p>
<h1 style="font-size: 32px; font-family: monospace; letter-spacing: 4px;">{{ .Token }}</h1>
<p>This code expires in 1 hour.</p>
<p>If you didn't request this code, you can safely ignore this email.</p>
```

## 🔐 Security Features

- ✅ Token expiration (1 hour default)
- ✅ One-time use tokens
- ✅ Rate limiting (Supabase built-in)
- ✅ Audit logging
- ✅ Secure HTTP-only cookies
- ✅ Email validation

## 📊 Monitoring

### View OTP Logs

```sql
SELECT * FROM public.otp_logs
ORDER BY created_at DESC
LIMIT 100;
```

### View Analytics

```sql
SELECT * FROM public.otp_analytics
ORDER BY date DESC;
```

## 🐛 Troubleshooting

| Issue               | Solution                                      |
| ------------------- | --------------------------------------------- |
| Email not received  | Check spam folder, verify Resend API key      |
| Invalid OTP         | Code expired (1h), already used, or incorrect |
| Rate limit error    | Wait 60 seconds and try again                 |
| Session not created | Check cookie settings, CORS config            |

## 🔗 Useful Links

- [Supabase Auth OTP Docs](https://supabase.com/docs/guides/auth/auth-otp)
- [Resend Email API Docs](https://resend.com/docs)
- Full Documentation: `markdowns/otp-authentication-setup.md`

## 📞 Support

For issues:

1. Check console logs (browser & server)
2. Review `markdowns/otp-authentication-setup.md`
3. Check Supabase dashboard logs
4. Review email delivery logs in Resend

## 🎯 Next Steps

1. **Configure Email Template** in Supabase Dashboard
2. **Test the Flow** using `/auth/otp-login`
3. **Deploy to Production**
4. **Monitor Usage** via analytics (optional)
5. **Customize UI** to match your brand

---

**Last Updated:** 2026-01-30  
**Version:** 1.0.0
