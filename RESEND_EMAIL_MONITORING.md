# 📧 **Resend Email Monitoring Setup Guide**

This guide shows you how to set up automated email monitoring using **Resend** (which you already have) to automatically create projects when emails arrive.

## 🎯 **How It Works**

1. **Email arrives** at `projects@yourdomain.com`
2. **Email gets forwarded** to your webhook endpoint
3. **Webhook processes** the email and extracts project info
4. **New project created** in your database
5. **Attachments uploaded** to Supabase Storage
6. **Initial discussion** created with email content

## 🔧 **Setup Options**

### **Option 1: Resend Custom Domain + Email Forwarding (Recommended)**

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

#### Step 1: Create IMAP Monitor

Create a new file `resend-imap-monitor.mjs`:

```javascript
import Imap from "imap";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const imap = new Imap({
  user: process.env.EMAIL_USER, // projects@yourdomain.com
  password: process.env.EMAIL_PASSWORD, // App password
  host: process.env.EMAIL_HOST || "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
});

function processEmail(stream, info) {
  simpleParser(stream, async (err, parsed) => {
    if (err) return console.error("Error parsing email:", err);

    console.log("📧 Processing email:", parsed.subject);

    // Send to your webhook
    try {
      const response = await fetch(
        process.env.WEBHOOK_URL || "http://localhost:4321/api/email-webhook",
        {
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
        }
      );

      if (response.ok) {
        console.log("✅ Email processed successfully");
      } else {
        console.error("❌ Failed to process email:", response.status);
      }
    } catch (error) {
      console.error("❌ Error sending to webhook:", error);
    }
  });
}

function checkEmails() {
  imap.openBox("INBOX", false, (err, box) => {
    if (err) throw err;

    imap.search(["UNSEEN"], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return;

      console.log(`📬 Found ${results.length} new emails`);

      const fetch = imap.fetch(results, { bodies: "" });
      fetch.on("message", (msg, seqno) => {
        msg.on("body", (stream, info) => {
          processEmail(stream, info);
        });
      });

      fetch.on("end", () => {
        console.log("✅ Finished processing emails");
      });
    });
  });
}

// Connect and start monitoring
imap.once("ready", () => {
  console.log("🚀 IMAP monitor connected");
  checkEmails();

  // Check every 5 minutes
  setInterval(checkEmails, 5 * 60 * 1000);
});

imap.once("error", (err) => {
  console.error("❌ IMAP error:", err);
});

imap.once("end", () => {
  console.log("🔌 IMAP connection ended");
});

imap.connect();
```

#### Step 2: Install Dependencies

```bash
npm install imap mailparser node-fetch
```

#### Step 3: Set Environment Variables

Add to your `.env` file:

```env
# Email Monitoring
EMAIL_USER=projects@yourdomain.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=imap.gmail.com
WEBHOOK_URL=https://yourdomain.com/api/email-webhook
```

#### Step 4: Run the Monitor

```bash
node resend-imap-monitor.mjs
```

## 🚀 **Quick Start with Resend**

### **1. Set Up Custom Domain**

```bash
# In Resend Dashboard
# Add domain: projects.yourdomain.com
# Verify DNS records
# Wait for verification
```

### **2. Configure Forwarding**

```bash
# In ForwardEmail.net or similar service
# Forward: projects@yourdomain.com → https://yourdomain.com/api/email-webhook
```

### **3. Test the System**

```bash
# Send test email
echo "Subject: Test Project
From: test@example.com
To: projects@yourdomain.com

Address: 123 Test Street
Square Footage: 1,000 sq ft
New Construction: No

We need fire protection for our building." | sendmail projects@yourdomain.com
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **Domain not verified**: Wait 10-15 minutes for DNS propagation
2. **Forwarding not working**: Check forwarding service configuration
3. **Webhook not receiving**: Verify endpoint URL and server status
4. **Authentication errors**: Check API keys and environment variables

### **Testing Commands:**

```bash
# Test webhook endpoint
curl -X POST https://yourdomain.com/api/email-webhook \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","subject":"Test","text":"Test content"}'

# Check webhook logs
tail -f your-app-logs.log
```

## 💡 **Why This Approach Works**

- **Resend handles sending** (which you already do well)
- **Custom domain** gives you professional email addresses
- **Email forwarding** bridges the gap between receiving and webhooks
- **IMAP monitoring** provides a self-hosted alternative
- **Your webhook** processes everything consistently

## 🎯 **Next Steps**

1. **Choose your preferred option** (forwarding service or IMAP)
2. **Set up the custom domain** in Resend
3. **Configure email forwarding** to your webhook
4. **Test with a sample email**
5. **Monitor the logs** for successful project creation

This approach gives you the best of both worlds: **Resend's excellent sending capabilities** and **automated email monitoring** for project creation! 🚀
