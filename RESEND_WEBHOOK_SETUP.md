# Resend Webhook Setup Guide

## 🎯 Overview

This guide will help you set up Resend webhooks to track email events (delivered, opened, clicked, bounced) for your application.

## 📧 Current Webhook URL

Your webhook endpoint is already configured at:

```
https://7ca0e9dfbf42.ngrok-free.app/api/resend-webhook
```

## 🛠 Setup Steps

### 1. Configure Webhook in Resend Dashboard

1. **Log into Resend Dashboard**
   - Go to [resend.com](https://resend.com)
   - Navigate to Settings → Webhooks

2. **Add New Webhook**
   - Click "Add Webhook"
   - Enter your webhook URL: `https://7ca0e9dfbf42.ngrok-free.app/api/resend-webhook`
   - Select the events you want to track:
     - ✅ `email.delivered` - Email successfully delivered
     - ✅ `email.opened` - Email opened by recipient
     - ✅ `email.clicked` - Link in email clicked
     - ✅ `email.bounced` - Email bounced/failed to deliver

3. **Copy Webhook Secret**
   - After creating the webhook, copy the webhook secret
   - This will be used to verify webhook signatures

### 2. Environment Configuration

The webhook secret should already be configured in your environment variables. If not, add it to your environment configuration:

```bash
# Resend Webhook (likely already configured)
RESEND_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note**: The `RESEND_WEBHOOK_SECRET` is already referenced in the codebase, so it should be configured in your environment variables or deployment platform.

### 3. Webhook Events Handled

The webhook endpoint (`/api/resend-webhook`) handles these events:

#### **Email Delivered**

- Logs successful email delivery
- No action needed

#### **Email Opened**

- Updates project status based on email type:
  - Proposal emails (status 30) → Status 40 (Proposal Viewed)
  - Invoice emails (status 70) → Status 80 (Invoice Viewed)
  - Submittal emails (status 110) → Status 120 (Submittals Viewed)
  - Final invoice emails (status 150) → Status 160 (Final Invoice Viewed)
  - Final deliverables (status 200) → Status 210 (Final Deliverables Viewed)

#### **Email Clicked**

- Logs link clicks
- Can be used for analytics

#### **Email Bounced**

- Logs failed email deliveries
- Can trigger notifications to admins

### 4. Testing the Webhook

1. **Send a test email** through your application
2. **Check the webhook logs** in your application console
3. **Verify events** are being received and processed

### 5. Production Deployment

When deploying to production:

1. **Update webhook URL** to your production domain:

   ```
   https://yourdomain.com/api/resend-webhook
   ```

2. **Update environment variables** with production secrets

3. **Test webhook functionality** in production environment

## 🔒 Security

- **HMAC Signature Verification**: All webhooks are verified using HMAC-SHA256
- **Webhook Secret**: Required for signature verification
- **HTTPS Only**: Webhooks must use HTTPS in production

## 📊 Monitoring

Monitor webhook events in your application logs:

- Look for `📧 [RESEND-WEBHOOK]` log entries
- Check for signature verification success/failure
- Monitor email event processing

## 🚨 Troubleshooting

### Common Issues:

1. **Webhook not receiving events**
   - Check ngrok tunnel is active
   - Verify webhook URL is correct
   - Check webhook secret is set

2. **Signature verification failing**
   - Ensure `RESEND_WEBHOOK_SECRET` is set correctly
   - Check webhook secret matches Resend dashboard

3. **Events not processing**
   - Check application logs for errors
   - Verify database connection
   - Check project status update logic

## 📝 Notes

- **Ngrok URL**: `https://7ca0e9dfbf42.ngrok-free.app` is for local development
- **Webhook Secret**: Keep this secure and never commit to version control
- **Event Processing**: Email opened events automatically update project status
- **Logging**: All webhook events are logged for debugging
