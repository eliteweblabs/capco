# 🚨 Sender Reputation Recovery Guide

## **Is Your Sender Flagged?**

**Short Answer:** Possibly, but it's recoverable! Here's how to determine and fix it.

## 🔍 **Check Your Current Status**

Run this diagnostic to see if you're flagged:

```bash
curl -s "http://localhost:4321/api/check-sender-reputation" | jq .
```

This will show:

- Domain verification status
- Recent bounce rates
- SMS gateway specific bounces
- Reputation assessment
- Recovery recommendations

## 🚨 **Signs You're Flagged by Carriers**

### **Immediate Red Flags:**

- ✅ **Multiple bounces to same carrier** (`@vtext.com`) ← **Your situation**
- ❌ High overall bounce rate (>10%)
- ❌ Sudden delivery failures after working fine
- ❌ Bounces with "rejected" or "blocked" messages

### **Verizon-Specific Indicators:**

- Multiple `@vtext.com` bounces in short timeframe
- Working fine with other carriers (`@txt.att.net`, `@tmomail.net`)
- Bounces started recently (carrier policy change)

## 🔧 **Recovery Strategy**

### **Phase 1: Immediate Actions (Already Done)**

- ✅ **Optimized SMS format** (empty subject, 160 chars, plain text)
- ✅ **Consistent sender** (`noreply@capcofire.com`)
- ✅ **SMS-specific headers**

### **Phase 2: Domain Authentication**

```bash
# Check if your domain is properly verified
curl -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
  "https://api.resend.com/domains"
```

**Required DNS Records:**

```dns
# SPF Record
TXT @ "v=spf1 include:_spf.resend.com ~all"

# DMARC Record
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@capcofire.com"

# DKIM Records (provided by Resend after domain verification)
```

### **Phase 3: Alternative Gateways**

If Verizon continues blocking, try these alternatives:

```javascript
// Alternative Verizon gateways
const verizonAlternatives = [
  "@vzwpix.com", // Verizon picture messaging (less filtered)
  "@vtext.com", // Standard (current)
];

// Test different carriers for same network
const verizonMVNOs = [
  "@vmobl.com", // Virgin Mobile
  "@mymetropcs.com", // MetroPCS
];
```

## 🎯 **Recovery Timeline**

### **Immediate (0-24 hours):**

- Optimized format reduces new bounces
- Test alternative gateways
- Verify domain authentication

### **Short-term (1-7 days):**

- Gradual sending volume increase
- Monitor bounce rates daily
- Carrier reputation slowly improves

### **Long-term (1-4 weeks):**

- Full sender reputation recovery
- Consistent delivery rates
- Consider dedicated SMS service

## 🆘 **Backup Solutions**

### **Option 1: Dedicated SMS Service**

Switch critical notifications to real SMS:

```javascript
// Twilio SMS API example
const client = twilio(accountSid, authToken);
await client.messages.create({
  body: "CAPCo Fire: Project update",
  from: "+15551234567",
  to: "+16176333533",
});
```

### **Option 2: Multiple Sender Domains**

Use different domain for SMS:

```javascript
// Use subdomain for SMS gateway emails
const smsPayload = {
  from: "sms@notifications.capcofire.com",
  to: "6176333533@vtext.com",
  subject: "",
  text: message,
};
```

### **Option 3: Hybrid Approach**

- **Critical notifications** → Real SMS service
- **Non-critical updates** → Email gateway (with fixes)

## 📊 **Monitoring & Prevention**

### **Daily Monitoring:**

```bash
# Check recent bounces
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  "https://api.resend.com/emails?limit=50" | \
  jq '.data[] | select(.last_event == "bounced")'
```

### **Weekly Analysis:**

- Bounce rate trends
- Carrier-specific patterns
- Volume vs. delivery correlation

### **Best Practices Going Forward:**

1. **Gradual volume increases** (no sudden spikes)
2. **Monitor bounce rates** (<5% overall, <10% SMS gateway)
3. **Consistent sending patterns** (avoid irregular bursts)
4. **Content optimization** (short, plain text for SMS)
5. **Alternative gateway testing** (fallback options)

## 🎯 **Is Recovery Possible?**

**YES!** Here's why:

1. **Not Permanently Blacklisted** - Carriers use reputation scores, not permanent blocks
2. **Format Changes Help** - Optimized format reduces spam triggers
3. **Domain Authentication** - Proper DNS setup rebuilds trust
4. **Gradual Recovery** - Consistent good behavior improves reputation
5. **Alternative Options** - Multiple gateways and SMS services available

## 🔍 **Test Your Recovery**

After implementing fixes:

```bash
# Test optimized format
curl -X POST http://localhost:4321/api/test-sms-gateway \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "6176333533",
    "carrier": "verizon",
    "testMessage": "Recovery test from CAPCo"
  }'

# Monitor results in Resend dashboard
# Check bounce rates over 24-48 hours
```

## 🚀 **Expected Recovery Timeline**

- **Day 1-2:** Reduced bounce rate with optimized format
- **Week 1:** Gradual improvement in delivery
- **Week 2-4:** Full reputation recovery
- **Ongoing:** Maintain good sending practices

**The fixes should prevent further reputation damage and start the recovery process immediately!** 🎯
