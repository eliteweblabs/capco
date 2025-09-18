# 📱 SMS Gateway Bounce Issue - Analysis & Solutions

## 🚨 **Problem Analysis**

Your SMS gateway emails are bouncing to `@vtext.com` addresses (Verizon). This is increasingly common due to:

1. **Carrier Policy Changes** - Verizon has tightened spam filtering
2. **Content Filtering** - Subject lines and HTML content trigger blocks
3. **Sender Reputation** - Bulk email patterns flagged as spam
4. **Message Format** - Non-SMS-compliant formatting causes bounces

## ✅ **Immediate Fixes Applied**

### 1. **Optimized Email Format for SMS Gateways**

- ✅ **Empty Subject Line** - Reduces spam triggers
- ✅ **160 Character Limit** - Standard SMS length
- ✅ **Plain Text Only** - No HTML content
- ✅ **Consistent Sender** - `CAPCo Fire <noreply@capcofire.com>`
- ✅ **SMS Headers** - Added `X-SMS-Gateway: true`

### 2. **Message Content Optimization**

```
Before: "CAPCo Fire Protection: Your project 'Project Name' status has been updated to: Status Name\n\nProject Address: 123 Main St\n\nReply STOP to opt out of SMS notifications."

After: "CAPCo Fire: 'Project Name' → Status Name\nAddr: 123 Main St\nReply STOP to opt out"
```

### 3. **Files Modified**

- `src/pages/api/send-email-sms.ts` - Optimized SMS gateway format
- `src/pages/api/email-delivery.ts` - Updated SMS handling
- `src/lib/sms-utils.ts` - Shortened message format
- `src/pages/api/test-sms-gateway.ts` - New testing tool

## 🧪 **Testing Your SMS Gateway**

Use the new testing endpoint:

```bash
curl -X POST http://localhost:4321/api/test-sms-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "6176333533",
    "carrier": "verizon",
    "testMessage": "Test message from CAPCo Fire"
  }'
```

This will test 3 different formats and show which works best.

## 🔧 **Additional Recommendations**

### 1. **Verify Resend Domain Authentication**

Check your Resend dashboard to ensure `capcofire.com` is properly verified:

- SPF record: `v=spf1 include:_spf.resend.com ~all`
- DKIM records properly configured
- Domain status shows "Verified"

### 2. **Alternative SMS Gateways**

If Verizon continues blocking, try:

```javascript
// Alternative gateways for Verizon numbers
const verizonAlternatives = [
  "@vzwpix.com", // Verizon picture messaging
  "@vtext.com", // Standard (current)
  "@vmobl.com", // Virgin Mobile (Verizon MVNO)
];
```

### 3. **Carrier-Specific Optimizations**

```javascript
// Carrier-specific message limits
const carrierLimits = {
  verizon: 160, // Standard SMS
  att: 160, // Standard SMS
  tmobile: 1600, // Supports longer messages
  sprint: 160, // Standard SMS
};
```

### 4. **Rate Limiting**

Add delays between SMS sends to avoid carrier rate limits:

```javascript
// Wait 2-3 seconds between SMS gateway emails
await new Promise((resolve) => setTimeout(resolve, 2000));
```

## 🎯 **Why This Should Fix the Bounces**

1. **Empty Subject** - Many carriers block emails with "spammy" subjects
2. **Short Messages** - Carriers prefer standard SMS length (160 chars)
3. **Plain Text Only** - HTML content often triggers spam filters
4. **Consistent Sender** - Using verified domain sender
5. **SMS Headers** - Identifies message as SMS gateway traffic

## 📊 **Monitor Results**

After implementing these changes:

1. **Test with the diagnostic tool** first
2. **Send a few test messages** to the problematic numbers
3. **Check Resend dashboard** for delivery status
4. **Monitor bounce rates** over 24-48 hours

## 🆘 **Backup Solutions**

If bounces continue:

### Option 1: **Direct SMS Service**

Consider switching to a dedicated SMS provider:

- Twilio SMS API
- AWS SNS
- MessageBird

### Option 2: **Multiple Gateway Strategy**

Try different gateways for the same carrier:

```javascript
const verizonGateways = ["@vtext.com", "@vzwpix.com"];
```

### Option 3: **Hybrid Approach**

Use SMS service for critical notifications, email gateway for non-critical.

## 🔍 **Debugging Commands**

Test the changes:

```bash
# Test SMS gateway
curl -X POST http://localhost:4321/api/test-sms-gateway \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "6176333533", "carrier": "verizon"}'

# Check Resend logs
# Go to: https://resend.com/logs

# Test email delivery
curl -X POST http://localhost:4321/api/email-delivery \
  -H "Content-Type: application/json" \
  -d '{
    "usersToNotify": ["6176333533@vtext.com"],
    "emailSubject": "Test",
    "emailContent": "Short test message"
  }'
```

The fixes should significantly improve delivery rates to Verizon SMS gateways! 🚀
