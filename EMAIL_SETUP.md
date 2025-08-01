# Email Service Setup Guide

Your global services system requires an email provider to send emails. Here's how to set it up:

## Quick Setup

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Choose your email provider and get an API key:**

### Option A: Resend (Recommended)

- Sign up at [resend.com](https://resend.com)
- Go to [API Keys](https://resend.com/api-keys)
- Create a new API key
- Update your `.env` file:
  ```env
  EMAIL_PROVIDER=resend
  EMAIL_API_KEY=re_your_api_key_here
  FROM_EMAIL=noreply@yourdomain.com
  FROM_NAME=Your App Name
  ```

### Option B: SendGrid

- Sign up at [sendgrid.com](https://sendgrid.com)
- Go to [Settings > API Keys](https://app.sendgrid.com/settings/api_keys)
- Create a new API key with "Mail Send" permissions
- Update your `.env` file:
  ```env
  EMAIL_PROVIDER=sendgrid
  EMAIL_API_KEY=SG.your_api_key_here
  FROM_EMAIL=noreply@yourdomain.com
  FROM_NAME=Your App Name
  ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Testing Email Configuration

Once configured, you can test emails using:

1. **API Endpoint Test:**

   ```bash
   curl -X GET http://localhost:4321/api/send-email
   ```

2. **Global Services Example:**
   - Navigate to your `GlobalServicesExample.astro` component
   - Click "Send Welcome Email" button
   - Check the event log for success/error messages

## Domain Setup (Production)

For production use, you'll need to:

### Resend:

1. Add your domain in [Resend Dashboard > Domains](https://resend.com/domains)
2. Add DNS records as instructed
3. Verify domain ownership

### SendGrid:

1. Set up [Domain Authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)
2. Configure sender identity
3. Add DNS records for SPF/DKIM

## Troubleshooting

### Common Issues:

**"SMTP provider is not available"**

- Solution: Set `EMAIL_PROVIDER=resend` or `EMAIL_PROVIDER=sendgrid`

**"API key is required"**

- Solution: Set `EMAIL_API_KEY` with your provider's API key

**"Invalid API key"**

- Solution: Double-check your API key and ensure it has correct permissions

**Emails not sending in production:**

- Verify domain authentication
- Check API key environment variables
- Review email provider logs

### Development Mode

For development, you can use any email address for `FROM_EMAIL`, but some providers require verification:

- **Resend**: No verification needed for development
- **SendGrid**: May require sender verification

## Environment Variables Reference

```env
# Required
EMAIL_PROVIDER=resend          # or 'sendgrid'
EMAIL_API_KEY=your_api_key     # Your provider's API key
FROM_EMAIL=noreply@domain.com  # Sender email address
FROM_NAME=Your App Name        # Sender display name

# Optional
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key
```

## Usage Examples

Once configured, use the global services:

```javascript
import { sendEmail } from "../lib/global-services";

// Send welcome email
await sendEmail({
  to: "user@example.com",
  type: "welcome",
  variables: { name: "John Doe" },
});

// Send custom email
await sendEmail({
  to: "user@example.com",
  type: "custom",
  subject: "Custom Subject",
  html: "<h1>Hello!</h1>",
  text: "Hello!",
});
```

The system will automatically handle errors and show user notifications if email configuration is missing.
