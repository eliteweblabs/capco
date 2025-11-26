# SPF & DKIM Setup Guide for firepumptestingco.com

This guide walks you through setting up SPF and DKIM records for your domain to improve email deliverability and prevent spoofing.

## 📋 What Are SPF and DKIM?

- **SPF (Sender Policy Framework)**: Tells receiving mail servers which servers are authorized to send email on behalf of your domain
- **DKIM (DomainKeys Identified Mail)**: Adds a cryptographic signature to your emails to prove they came from your domain and weren't tampered with

Both records significantly improve email deliverability and reduce the chance of your emails being marked as spam.

---

## 🚀 Step-by-Step Setup

### Step 1: Determine Your Email Provider

For WordPress sites on Kinsta, common email providers include:

- **Gmail/Google Workspace** (most common)
- **Microsoft 365/Outlook**
- **SendGrid** (for transactional emails)
- **Mailgun** (for transactional emails)
- **WP Mail SMTP** plugin (uses various providers)
- **Kinsta's email service** (if available)

**Note**: Determine which service you're using for sending emails from your WordPress site. Check your WordPress plugins (like WP Mail SMTP) or your hosting email settings.

### Step 2: Access Squarespace DNS Management

Since your domain is registered at Squarespace:

1. **Log into Squarespace**:
   - Go to [squarespace.com](https://www.squarespace.com) and sign in
   - Navigate to **Settings** → **Domains**
   - Click on **firepumptestingco.com**

2. **Check Nameserver Configuration**:
   - Look for **"DNS Settings"** or **"Advanced DNS Settings"**
   - Check if it says **"Managed by Squarespace"** or **"External Nameservers"**

   **If using Squarespace Nameservers** (recommended for this setup):
   - You'll manage DNS directly in Squarespace
   - Continue to Step 3 below

   **If using External Nameservers** (pointing to Kinsta, Cloudflare, etc.):
   - You'll need to add DNS records where your nameservers are pointing
   - If pointing to Kinsta, check Kinsta dashboard → Sites → Your Site → Domains → DNS
   - If pointing to Cloudflare, manage DNS in Cloudflare dashboard
   - If unsure, check your domain's nameservers using [whatsmydns.net](https://www.whatsmydns.net/#NS)

3. **Access DNS Records in Squarespace**:
   - Click **"DNS Settings"** or **"Custom Records"**
   - You should see existing records (A, CNAME, MX, etc.)
   - Look for **"Add Record"** or **"Custom Record"** button
   - Squarespace interface shows:
     - **Type** dropdown (A, CNAME, TXT, MX, etc.)
     - **Host** field (use `@` for root domain)
     - **Data** or **Value** field (the actual record value)
     - **TTL** (usually auto-set, can leave default)

**Important Notes for Squarespace**:

- Squarespace may have limitations on certain DNS record types
- If you can't add CNAME records for DKIM, you may need to switch to external nameservers (like Cloudflare - free)
- The "Host" field in Squarespace might be labeled differently - use `@` for root domain records

### Step 3: Set Up SPF Record

#### Adding SPF Record in Squarespace:

1. **In Squarespace DNS Settings**, click **"Add Record"** or **"Custom Record"**
2. **Select Record Type**: Choose `TXT`
3. **Fill in the values** based on your email provider:

   **For Gmail/Google Workspace:**
   - **Host**: `@` (or leave blank for root domain)
   - **Data/Value**: `v=spf1 include:_spf.google.com ~all`
   - **TTL**: Leave default or set to `3600`

   **For Microsoft 365/Outlook:**
   - **Host**: `@`
   - **Data/Value**: `v=spf1 include:spf.protection.outlook.com ~all`
   - **TTL**: Leave default or set to `3600`

   **For SendGrid:**
   - **Host**: `@`
   - **Data/Value**: `v=spf1 include:sendgrid.net ~all`
   - **TTL**: Leave default or set to `3600`

   **For Mailgun:**
   - **Host**: `@`
   - **Data/Value**: `v=spf1 include:mailgun.org ~all`
   - **TTL**: Leave default or set to `3600`

   **For Resend:**
   - **Host**: `@`
   - **Data/Value**: `v=spf1 include:_spf.resend.com ~all`
   - **TTL**: Leave default or set to `3600`

   **Squarespace-Specific Notes:**
   - Click **"Save"** or **"Add Record"** after entering values
   - If you already have an SPF record, you need to **edit** it, not create a duplicate
   - You can only have **one SPF record** per domain
   - If you have existing SPF records, combine them like: `v=spf1 include:_spf.google.com include:sendgrid.net ~all`
   - In Squarespace, the "Host" field might be labeled as "Host" or "Name" - use `@` for root domain
   - Some Squarespace plans may have DNS limitations - if you can't add records, contact Squarespace support

### Step 4: Set Up DKIM Records

DKIM records are specific to your email provider. You'll need to get them from your provider's dashboard.

**Important for Squarespace**: Some Squarespace plans have limitations on CNAME records. If you can't add CNAME records for DKIM, you may need to:

- Upgrade your Squarespace plan, OR
- Point nameservers to Cloudflare (free) and manage DNS there, OR
- Use your email provider's DNS management if they offer it

#### For Gmail/Google Workspace:

1. **Go to Google Admin Console**:
   - Visit [admin.google.com](https://admin.google.com)
   - Navigate to **Apps** → **Google Workspace** → **Gmail**
   - Click **"Authenticate email"** or **"Email authentication"**

2. **Select your domain** (`firepumptestingco.com`)

3. **Google will provide DKIM records** - usually a TXT record like:

   ```
   Name: google._domainkey
   Value: (long string provided by Google)
   ```

4. **Add to Squarespace DNS**:
   - Click **"Add Record"** or **"Custom Record"**
   - **Type**: Select `TXT`
   - **Host**: `google._domainkey` (without the domain name, just the subdomain part)
   - **Data/Value**: (paste the exact value from Google - it's usually a long string)
   - **TTL**: Leave default or set to `3600`
   - Click **"Save"** or **"Add Record"**

#### For Microsoft 365:

1. **Go to Microsoft 365 Admin Center**:
   - Visit [admin.microsoft.com](https://admin.microsoft.com)
   - Navigate to **Settings** → **Domains** → Select your domain
   - Click **"DNS records"** or **"DKIM"**

2. **Microsoft will provide CNAME records** (usually 2 records)

3. **Add to Squarespace DNS**:
   - Click **"Add Record"** or **"Custom Record"**
   - **Type**: Select `CNAME`
   - **Host**: (as provided by Microsoft, e.g., `selector1._domainkey` - just the subdomain part)
   - **Data/Value**: (as provided by Microsoft - usually ends with `.onmicrosoft.com`)
   - **TTL**: Leave default or set to `3600`
   - Click **"Save"** or **"Add Record"**
   - Repeat for the second CNAME record if provided

#### For SendGrid:

1. **Go to SendGrid Dashboard**:
   - Visit [app.sendgrid.com](https://app.sendgrid.com)
   - Navigate to **Settings** → **Sender Authentication** → **Domain Authentication**
   - Add your domain or select existing

2. **SendGrid will provide CNAME records** (usually 2-3 records)

3. **Add to Squarespace DNS**:
   - Click **"Add Record"** or **"Custom Record"**
   - **Type**: Select `CNAME`
   - **Host**: (as provided by SendGrid, e.g., `s1._domainkey` - just the subdomain part)
   - **Data/Value**: (as provided by SendGrid - usually ends with `.sendgrid.net`)
   - **TTL**: Leave default or set to `3600`
   - Click **"Save"** or **"Add Record"**
   - Repeat for all DKIM records provided (usually 2-3)

#### For Mailgun:

1. **Go to Mailgun Dashboard**:
   - Visit [app.mailgun.com](https://app.mailgun.com)
   - Navigate to **Sending** → **Domains** → Add or select domain

2. **Mailgun will provide TXT records** for DKIM

3. **Add to Squarespace DNS**:
   - Click **"Add Record"** or **"Custom Record"**
   - **Type**: Select `TXT`
   - **Host**: (as provided by Mailgun - usually something like `mailo._domainkey`)
   - **Data/Value**: (as provided by Mailgun - usually a long string)
   - **TTL**: Leave default or set to `3600`
   - Click **"Save"** or **"Add Record"**

#### For Resend:

1. **Go to Resend Dashboard**:
   - Visit [resend.com/domains](https://resend.com/domains)
   - Click **"Add Domain"** or select existing
   - Enter `firepumptestingco.com`

2. **Resend will provide CNAME records** (usually 3 records)

3. **Add to Squarespace DNS**:
   - Click **"Add Record"** or **"Custom Record"**
   - **Type**: Select `CNAME`
   - **Host**: `resend._domainkey` (or as provided - just the subdomain part)
   - **Data/Value**: `resend._domainkey.resend.com` (or as provided)
   - **TTL**: Leave default or set to `3600`
   - Click **"Save"** or **"Add Record"**
   - Repeat for all DKIM records provided (usually 3 records: `resend._domainkey`, `resend1._domainkey`, `resend2._domainkey`)

### Step 5: Verify DNS Propagation

1. **Wait 5-60 minutes** for DNS changes to propagate
2. **Check DNS propagation** using:
   - [MXToolbox SPF Checker](https://mxtoolbox.com/spf.aspx) - Enter `firepumptestingco.com`
   - [DKIM Validator](https://www.dmarcanalyzer.com/dkim-check/) - Enter your domain
   - Command line: `nslookup -type=TXT firepumptestingco.com`

3. **Verify in Your Email Provider Dashboard**:
   - **Gmail**: Check Google Admin Console → Gmail → Authenticate email
   - **Microsoft 365**: Check Admin Center → Domains → DNS records
   - **SendGrid**: Check Settings → Sender Authentication → Domain Authentication
   - **Mailgun**: Check Sending → Domains
   - **Resend**: Check resend.com/domains
   - Your domain should show as **"Verified"** with green checkmarks

### Step 6: Test Email Delivery

Send a test email and check:

1. **Email headers** - Look for `SPF: PASS` and `DKIM: PASS`
2. **Spam score** - Use tools like [Mail-Tester](https://www.mail-tester.com/)
3. **Deliverability** - Check if emails arrive in inbox vs spam folder

---

## 🔍 Common DNS Record Formats

### SPF Record Example:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

### DKIM Record Example (Resend):

```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
TTL: 3600
```

---

## ⚠️ Important Notes

### SPF Record Rules:

- ✅ **Only ONE SPF record** per domain
- ✅ Use `~all` (soft fail) or `-all` (hard fail) at the end
- ✅ Combine multiple providers: `v=spf1 include:provider1.com include:provider2.com ~all`

### DKIM Record Rules:

- ✅ Multiple DKIM records are normal (usually 2-3)
- ✅ Each provider has unique selector names (e.g., `resend._domainkey`, `google._domainkey`)
- ✅ Use exact values provided by your email provider

### DNS Propagation:

- ⏱️ Changes can take **5 minutes to 48 hours** to propagate globally
- 🌍 Use DNS checker tools to verify propagation worldwide
- 🔄 Clear your DNS cache if testing locally

---

## 🛠️ Troubleshooting

### SPF Not Working:

- **Check for duplicate SPF records** - You can only have one
- **Verify syntax** - Must start with `v=spf1`
- **Check DNS propagation** - Wait longer or check different DNS servers

### DKIM Not Working:

- **Verify CNAME records** - Ensure they're exactly as provided
- **Check selector names** - Must match provider's requirements
- **Wait for propagation** - DKIM can take longer than SPF

### Domain Not Verifying:

- **Double-check record values** - Copy/paste exactly from provider
- **Squarespace DNS format** - Make sure you're using the correct field names (Host vs Name)
- **Check TTL** - Lower TTL (300-600) helps with faster updates
- **Remove trailing dots** - Squarespace may add them automatically, remove if present
- **Nameserver check** - Verify your domain is using Squarespace nameservers (or where you're adding records)
- **WordPress email plugin** - If using WP Mail SMTP, check plugin settings for correct email provider

### Emails Still Going to Spam:

- SPF/DKIM help but aren't the only factors
- Also set up **DMARC** (see next section)
- Check sender reputation
- Avoid spam trigger words
- Use proper email authentication

---

## 📧 Optional: DMARC Record

For even better email security, add a DMARC record:

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@firepumptestingco.com
TTL: 3600
```

**DMARC Policies:**

- `p=none` - Monitor only (start here)
- `p=quarantine` - Send failures to spam
- `p=reject` - Reject failures completely

Start with `p=none` and monitor reports before moving to stricter policies.

---

## ✅ Verification Checklist

- [ ] SPF record added (TXT record)
- [ ] DKIM records added (CNAME records from provider)
- [ ] DNS changes propagated (checked with tools)
- [ ] Domain verified in email provider dashboard
- [ ] Test email sent and received
- [ ] Email headers show SPF: PASS and DKIM: PASS
- [ ] (Optional) DMARC record added

---

## 🔗 Useful Tools

- **SPF Checker**: https://mxtoolbox.com/spf.aspx
- **DKIM Validator**: https://www.dmarcanalyzer.com/dkim-check/
- **Email Header Analyzer**: https://mxtoolbox.com/EmailHeaders/
- **Mail Tester**: https://www.mail-tester.com/
- **DNS Propagation Checker**: https://www.whatsmydns.net/

---

## 📞 Need Help?

If you're stuck:

1. **Squarespace Support**: [help.squarespace.com](https://help.squarespace.com) - Search "DNS records" or "custom DNS"
2. **Kinsta Support**: [kinsta.com/support](https://kinsta.com/support) - They can help with WordPress email configuration
3. Check your email provider's documentation
4. Verify DNS records are correct in Squarespace
5. Wait for full DNS propagation (up to 48 hours)
6. **Squarespace DNS Limitations**: If Squarespace doesn't support certain record types, you may need to:
   - Point nameservers to Kinsta (if they provide DNS)
   - Use Cloudflare (free DNS management)
   - Use your email provider's DNS management

---

## 🎯 Quick Reference for firepumptestingco.com

**Setup Details:**

- **Domain Registrar**: Squarespace
- **Hosting**: Kinsta (WordPress)
- **DNS Management**: Squarespace DNS Settings

**If using Gmail/Google Workspace:**

- SPF: `v=spf1 include:_spf.google.com ~all` (TXT record, Host: `@`)
- DKIM: Get from Google Admin Console → Apps → Google Workspace → Gmail → Authenticate email
- Usually a TXT record at `google._domainkey`

**If using Microsoft 365:**

- SPF: `v=spf1 include:spf.protection.outlook.com ~all` (TXT record, Host: `@`)
- DKIM: Get from Microsoft 365 Admin Center → Settings → Domains → DNS records
- Usually 2 CNAME records

**If using SendGrid:**

- SPF: `v=spf1 include:sendgrid.net ~all` (TXT record, Host: `@`)
- DKIM: Get from SendGrid Dashboard → Settings → Sender Authentication → Domain Authentication
- Usually 2-3 CNAME records

**If using Mailgun:**

- SPF: `v=spf1 include:mailgun.org ~all` (TXT record, Host: `@`)
- DKIM: Get from Mailgun Dashboard → Sending → Domains
- Usually TXT records

**If using Resend:**

- SPF: `v=spf1 include:_spf.resend.com ~all` (TXT record, Host: `@`)
- DKIM: Get from Resend dashboard after adding domain
- Usually 3 CNAME records

---

**Last Updated**: 2025-01-23
**Domain**: firepumptestingco.com
**Hosting**: Kinsta (WordPress)
**Domain Registrar**: Squarespace
