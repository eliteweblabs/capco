# Email Monitoring Setup Guide

This guide will help you set up automatic project creation from emails sent to a monitored email address.

## 🎯 Overview

The email monitoring system allows clients to send project requests via email, which are automatically parsed and converted into projects in your system.

## 📧 How It Works

1. **Client sends email** to your monitored address (e.g., `projects@yourcompany.com`)
2. **Email service** forwards the email to your webhook endpoint
3. **System parses** the email content to extract project details
4. **Project is created** automatically with extracted information
5. **Admin notification** is sent (optional)
6. **Confirmation email** is sent to the client (optional)

## 🛠 Setup Steps

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Email Monitoring
EMAIL_MONITORING_ENABLED=true
MONITORED_EMAIL=projects@yourcompany.com
EMAIL_PROVIDER=sendgrid
EMAIL_WEBHOOK_SECRET=your-secure-webhook-secret
AUTO_CREATE_PROJECTS=true
REQUIRE_PROJECT_APPROVAL=false
NOTIFY_ADMINS_ON_EMAIL=true

# SendGrid (recommended)
SENDGRID_API_KEY=your-sendgrid-api-key

# Alternative: Mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.com
```

### 2. Choose Email Service Provider

#### Option A: SendGrid (Recommended)

1. **Create SendGrid Account**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Create an API key with full access

2. **Set up Inbound Parse**
   - Go to Settings > Inbound Parse
   - Add your webhook URL: `https://yourdomain.com/api/email-webhook`
   - Configure the subdomain (e.g., `projects.yourcompany.com`)

3. **Configure DNS**
   - Add MX record: `projects.yourcompany.com` → `mx.sendgrid.net`
   - Priority: 10

#### Option B: Mailgun

1. **Create Mailgun Account**
   - Sign up at [mailgun.com](https://mailgun.com)
   - Add and verify your domain

2. **Set up Webhooks**
   - Go to Webhooks in your domain settings
   - Add webhook URL: `https://yourdomain.com/api/email-webhook`
   - Subscribe to relevant events

3. **Configure DNS**
   - Follow Mailgun's DNS setup instructions
   - Add required MX, CNAME, and TXT records

### 3. Test the Setup

1. **Access Admin Dashboard**
   - Go to `/admin/email-monitoring`
   - Check that monitoring status shows "Active"

2. **Send Test Email**
   - Use the test form in the admin dashboard
   - Or send a real email to your monitored address

3. **Verify Project Creation**
   - Check if project appears in your dashboard
   - Review extracted information for accuracy

## 📝 Email Format Guidelines

To improve parsing accuracy, encourage clients to use this format:

```
Subject: Fire Protection System - [Project Address]

Address: 123 Main Street, Springfield, IL 62701
Square Footage: 5,000 sq ft
Building Type: Commercial
Services Needed: Sprinkler, Alarm
New Construction: Yes
Architect: ABC Architecture Firm

Additional details:
We need a complete fire protection system design for our new commercial building. The project includes retail space on the first floor and offices on the second floor.

Contact: John Smith
Email: john@example.com
Phone: (555) 123-4567
```

## 🎯 What Gets Extracted

The system automatically extracts:

- **Address/Location** - From subject line or "Address:" field
- **Square Footage** - Numbers followed by "sq ft", "square feet", etc.
- **Building Type** - Commercial, Residential, Mixed Use, etc.
- **Services** - Sprinkler, Alarm, Mechanical, etc.
- **New Construction** - Yes/No based on keywords
- **Owner Information** - From email sender and content
- **Project Description** - First paragraph or key details

## 🔧 Customization

### Modify Parsing Rules

Edit `src/lib/email-monitoring.ts` to adjust:

- **Email patterns** for better extraction
- **Validation rules** for data quality
- **Confidence scoring** algorithms

### Add New Fields

To extract additional fields:

1. Add pattern to `emailPatterns` object
2. Create extraction function
3. Update project creation logic
4. Add to database schema if needed

### Integration Options

- **Slack Notifications** - Add webhook to notify team
- **CRM Integration** - Sync with external CRM systems
- **File Attachments** - Process PDF attachments
- **Auto-Categorization** - ML-based project classification

## 📊 Monitoring & Analytics

### Admin Dashboard Features

- Real-time processing statistics
- Recent activity log
- Configuration status
- Test email processing
- Error monitoring

### Key Metrics

- **Processing Success Rate** - Percentage of emails successfully parsed
- **Extraction Confidence** - Quality score of extracted data
- **Response Time** - How quickly emails are processed
- **Volume Trends** - Email traffic patterns

## 🚨 Troubleshooting

### Common Issues

1. **Emails Not Being Received**
   - Check DNS configuration
   - Verify webhook URL is accessible
   - Check email service provider logs

2. **Poor Extraction Quality**
   - Review email format guidelines
   - Adjust parsing patterns
   - Lower confidence threshold

3. **Authentication Errors**
   - Verify API keys are correct
   - Check webhook secret configuration
   - Ensure proper permissions

### Debug Mode

Enable detailed logging by setting:

```bash
EMAIL_DEBUG_MODE=true
```

This will log all incoming emails and extraction attempts.

## 🔒 Security Considerations

- **Webhook Security** - Use webhook secrets to verify requests
- **Rate Limiting** - Implement to prevent abuse
- **Data Validation** - Sanitize all extracted data
- **Access Control** - Restrict admin dashboard access
- **Audit Logging** - Track all email processing activity

## 📈 Advanced Features

### Machine Learning Enhancement

Consider adding:

- **Natural Language Processing** for better content understanding
- **Address Validation** using geocoding APIs
- **Company Recognition** to identify repeat clients
- **Priority Detection** for urgent requests

### Workflow Automation

- **Approval Workflows** for low-confidence extractions
- **Auto-Assignment** based on project type or location
- **Follow-up Scheduling** for incomplete submissions
- **Integration Triggers** for external systems

## 🆘 Support

For issues or questions:

1. Check the admin dashboard for error logs
2. Review this documentation
3. Test with the built-in email tester
4. Contact your system administrator

---

**Note**: This system is designed to handle typical fire protection project requests. Complex or unusual email formats may require manual review and processing.
