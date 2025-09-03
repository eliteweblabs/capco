# 📧 Email Monitoring System Setup Guide

This guide will help you set up automatic project creation from incoming emails. The system monitors a specific email address and automatically creates new projects when emails arrive.

## 🚀 **How It Works**

1. **Email arrives** at your monitored email address
2. **Webhook triggered** to your API endpoint
3. **Email parsed** for project information (address, square footage, etc.)
4. **User found/created** based on sender email
5. **Project created** with extracted information
6. **Attachments uploaded** as project documents
7. **Initial discussion** created from email content

## 🔧 **Setup Options**

## ⚙️ **Environment Variables**

Add these to your `.env` file for email monitoring:

```env
# Email Monitoring (for IMAP option)
EMAIL_USER=projects@yourdomain.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=imap.gmail.com
WEBHOOK_URL=https://yourdomain.com/api/email-webhook
CHECK_INTERVAL=300000  # 5 minutes in milliseconds

# For Gmail, you'll need an App Password:
# 1. Enable 2FA on your Google account
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Use that password instead of your regular password
```

### **Option 1: Resend Custom Domain + Email Forwarding (Recommended for You!)**

Since you already have Resend, this is the best approach:

#### Step 1: Set Up Custom Domain in Resend

1. Go to your [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to **Domains**
3. Click **Add Domain**
4. Enter your domain: `projects.yourdomain.com`
5. Follow the DNS verification steps
6. Wait for domain verification (usually 5-10 minutes)

#### Step 2: Configure Email Forwarding

Since Resend doesn't have built-in email receiving, use a forwarding service:

**Option A: ForwardEmail.net (Free)**

1. Go to [forwardemail.net](https://forwardemail.net)
2. Create an account
3. Add your domain: `yourdomain.com`
4. Create a forwarding rule:
   - **From**: `projects@yourdomain.com`
   - **To**: `https://yourdomain.com/api/email-webhook`
   - **Type**: Webhook
5. Save the rule

**Option B: ImproveMX (Paid, more reliable)**

1. Go to [improvmx.com](https://improvmx.com)
2. Add your domain
3. Create forwarding rule to your webhook
4. Update DNS records as instructed

#### Step 3: Test the Setup

1. Send an email to `projects@yourdomain.com`
2. Check your webhook logs
3. Verify project creation in database

### **Option 2: Resend + IMAP Monitoring (Self-hosted)**

SendGrid has a built-in "Inbound Parse" feature specifically designed for receiving emails via webhooks.

#### Step 1: Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key with full access
3. Verify your account

#### Step 2: Set Up Inbound Parse

1. Go to **Settings** → **Inbound Parse**
2. Click **Add Host & URL**
3. Set **Hostname**: `projects.yourcompany.com` (or your preferred subdomain)
4. Set **URL**: `https://yourdomain.com/api/email-webhook`
5. Set **Check for spam**: Yes (recommended)
6. Set **Post the raw, full MIME message**: Yes
7. Click **Save**

#### Step 3: Configure DNS

Add these DNS records to your domain:

```
Type: MX
Name: projects
Value: mx.sendgrid.net
Priority: 10
TTL: 3600

Type: CNAME
Name: projects
Value: sendgrid.net
TTL: 3600
```

#### Step 4: Test the Setup

1. Send an email to `projects@yourcompany.com`
2. Check your webhook logs for incoming data
3. Verify project creation in your database

### **Option 2: Mailgun Routes**

Mailgun can route incoming emails to webhooks with good reliability.

#### Step 1: Create Mailgun Account

1. Sign up at [mailgun.com](https://mailgun.com)
2. Add and verify your domain
3. Go to **Sending** → **Domains**

#### Step 2: Set Up Routes

1. Go to **Receiving** → **Routes**
2. Click **Create Route**
3. Set **Route Expression**: `match_recipient(".*@yourdomain.com")`
4. Set **Action**: `forward("https://yourdomain.com/api/email-webhook")`
5. Set **Priority**: 0
6. Click **Create Route**

### **Option 3: Resend + Email Forwarding Service**

Since you already have Resend, you can use it with a third-party email forwarding service.

#### Step 1: Use Email Forwarding Service

Services like **ForwardEmail.net** or **ImproveMX** can forward emails to webhooks:

1. Sign up for an email forwarding service
2. Set up forwarding from `projects@yourdomain.com`
3. Configure webhook endpoint: `https://yourdomain.com/api/email-webhook`
4. The service will forward emails to your webhook

### **Option 3: IMAP Monitoring (Self-hosted)**

#### Step 1: Create IMAP Service

Create a new file `email-monitor.mjs`:

```javascript
import Imap from "imap";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";

const imap = new Imap({
  user: "your-email@domain.com",
  password: "your-app-password",
  host: "imap.gmail.com", // or your email provider
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

function processEmail(stream, info) {
  simpleParser(stream, async (err, parsed) => {
    if (err) return console.error("Error parsing email:", err);

    // Send to your webhook
    const response = await fetch("http://localhost:4321/api/email-webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: parsed.from.text,
        to: parsed.to.text,
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html,
        attachments: parsed.attachments.map((att) => ({
          filename: att.filename,
          content: att.content.toString("base64"),
          contentType: att.contentType,
        })),
      }),
    });

    console.log("Email processed:", parsed.subject);
  });
}

function checkEmails() {
  imap.openBox("INBOX", false, (err, box) => {
    if (err) throw err;

    imap.search(["UNSEEN"], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return;

      const fetch = imap.fetch(results, { bodies: "" });
      fetch.on("message", (msg, seqno) => {
        msg.on("body", (stream, info) => {
          processEmail(stream, info);
        });
      });
    });
  });
}

// Check emails every 5 minutes
setInterval(checkEmails, 5 * 60 * 1000);
checkEmails(); // Initial check
```

#### Step 2: Install Dependencies

```bash
npm install imap mailparser node-fetch
```

#### Step 3: Run the Monitor

```bash
node email-monitor.mjs
```

## 📋 **Email Format Requirements**

For best results, clients should structure their emails like this:

```
Subject: New Fire Protection Project - 123 Main Street

Address: 123 Main Street, Anytown, CA 90210
Square Footage: 5,000 sq ft
New Construction: Yes

Project Description:
We need a complete fire protection system for our new office building...

[Attach any relevant documents]
```

## 🔍 **Information Extraction**

The system automatically extracts:

- **Address**: Looks for patterns like "Address:", "Location:", "Property:"
- **Square Footage**: Detects patterns like "5,000 sq ft", "5000 square feet"
- **New Construction**: Identifies keywords like "new construction", "new build"
- **Project Title**: Combines email subject with address
- **Description**: Uses email body content

## 🛡️ **Security Considerations**

### **Webhook Authentication**

Add authentication to your webhook endpoint:

```typescript
// In your email-webhook.ts
const webhookSecret = process.env.WEBHOOK_SECRET;

// Verify webhook signature
const signature = request.headers.get("x-webhook-signature");
if (!verifySignature(body, signature, webhookSecret)) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

### **Rate Limiting**

Implement rate limiting to prevent abuse:

```typescript
// Add rate limiting middleware
const rateLimit = new Map();
const MAX_REQUESTS = 10; // per minute
const WINDOW_MS = 60 * 1000;

// Check rate limit
const clientIP = request.headers.get("x-forwarded-for") || "unknown";
const now = Date.now();
const windowStart = now - WINDOW_MS;

if (!rateLimit.has(clientIP)) {
  rateLimit.set(clientIP, []);
}

const requests = rateLimit.get(clientIP).filter((time) => time > windowStart);
if (requests.length >= MAX_REQUESTS) {
  return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429 });
}

requests.push(now);
rateLimit.set(clientIP, requests);
```

## 🧪 **Testing the System**

### **Test with cURL**

```bash
curl -X POST http://localhost:4321/api/email-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "client@example.com",
    "to": "projects@yourcompany.com",
    "subject": "New Fire Protection Project",
    "text": "Address: 123 Main Street\nSquare Footage: 5,000 sq ft\nNew Construction: Yes",
    "attachments": []
  }'
```

### **Expected Response**

```json
{
  "success": true,
  "projectId": 123,
  "message": "Project created successfully from email"
}
```

## 📊 **Monitoring & Logs**

The system provides comprehensive logging:

- **Email received**: Webhook triggered
- **User lookup**: Finding/creating user profile
- **Project creation**: New project in database
- **File uploads**: Attachment processing
- **Discussion creation**: Initial project discussion

Check your server logs for detailed information about each step.

## 🔄 **Customization Options**

### **Custom Email Parsing**

Modify the `extractProjectInfo` function to handle your specific email formats:

```typescript
function extractProjectInfo(emailData: EmailWebhookData) {
  // Add your custom patterns here
  const customPatterns = [
    /project\s*type[:\s]+([^\n\r]+)/i,
    /budget[:\s]+([^\n\r]+)/i,
    /timeline[:\s]+([^\n\r]+)/i,
  ];

  // Your custom extraction logic
}
```

### **Custom Project Fields**

Add additional fields to the project creation:

```typescript
const { data: project, error } = await supabase
  .from("projects")
  .insert({
    author_id: userId,
    title: projectInfo.title,
    address: projectInfo.address,
    sq_ft: projectInfo.sqft,
    new_construction: projectInfo.newConstruction,
    // Add custom fields
    project_type: projectInfo.projectType,
    budget: projectInfo.budget,
    timeline: projectInfo.timeline,
    status: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Webhook not receiving emails**
   - Check webhook URL is correct
   - Verify webhook is active in your email provider
   - Check server logs for errors

2. **Projects not being created**
   - Verify database permissions
   - Check required fields are present
   - Review email parsing logic

3. **Attachments not uploading**
   - Check Supabase Storage bucket exists
   - Verify storage permissions
   - Check file size limits

### **Debug Mode**

Enable detailed logging by setting environment variable:

```bash
export DEBUG_EMAIL_WEBHOOK=true
```

## 📈 **Scaling Considerations**

- **Queue System**: For high volume, implement a job queue (Redis/Bull)
- **Multiple Webhooks**: Set up webhooks for different email addresses
- **Load Balancing**: Distribute webhook processing across multiple servers
- **Database Optimization**: Add indexes for email-related queries

## 🎯 **Next Steps**

1. **Choose your setup option** (Resend webhook recommended)
2. **Configure email forwarding** to your webhook endpoint
3. **Test with sample emails** to verify functionality
4. **Customize parsing logic** for your specific needs
5. **Add authentication** and rate limiting
6. **Monitor and optimize** based on usage patterns

This system will automate your project creation workflow, saving time and ensuring no client inquiries are missed! 🚀
