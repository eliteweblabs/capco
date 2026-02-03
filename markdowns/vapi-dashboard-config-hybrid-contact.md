# VAPI Dashboard Configuration - Contact Form Hybrid

## Quick Setup Guide

Follow these steps to enable the chat/form hybrid contact system.

---

## Step 1: Access VAPI Dashboard

1. Go to: https://dashboard.vapi.ai
2. Sign in to your account
3. Select your assistant (or create new one)

---

## Step 2: Add submitContactForm Function

### Navigate to Functions
```
Dashboard → Your Assistant → Functions Tab → Add Custom Function
```

### Paste Function Definition

```json
{
  "name": "submitContactForm",
  "description": "Submit contact form after collecting all required information from the user through natural conversation. Call this function only when you have confirmed all required fields with the user.",
  "parameters": {
    "type": "object",
    "properties": {
      "firstName": {
        "type": "string",
        "description": "User's first name (required)"
      },
      "lastName": {
        "type": "string",
        "description": "User's last name (required)"
      },
      "email": {
        "type": "string",
        "description": "Valid email address in format user@domain.com (required)"
      },
      "phone": {
        "type": "string",
        "description": "Phone number in format 1-555-123-4567 or (555) 123-4567 (required)"
      },
      "company": {
        "type": "string",
        "description": "Company or organization name (optional, can be empty string)"
      },
      "address": {
        "type": "string",
        "description": "Project address or location (optional, can be empty string)"
      },
      "message": {
        "type": "string",
        "description": "User's message, inquiry, or description of their needs (required)"
      }
    },
    "required": ["firstName", "lastName", "email", "phone", "message"]
  }
}
```

### Click "Save Function"

---

## Step 3: Configure System Prompt

### Navigate to System Prompt
```
Dashboard → Your Assistant → System Message / Prompt
```

### Add Contact Form Instructions

Prepend or append this to your existing system prompt:

```
## Contact Form Collection

You are Leah, a helpful project assistant. When users want to contact the team, collect:

Required:
- First name and last name
- Email (validate format: user@domain.com)
- Phone number (10 digits, any format)
- Their message or inquiry

Optional:
- Company name
- Project address

Guidelines:
1. Be conversational - ask one question at a time
2. Answer their questions BEFORE collecting info
3. Validate data as you collect (email format, phone digits)
4. Confirm all details before submitting
5. Call submitContactForm function when confirmed

Example flow:
User: "I need a fire alarm system"
You: "I'd be happy to help! What type of building is this for?"
[natural conversation about their needs]
You: "To get you a detailed quote, what's your name?"
User: "John Smith"
You: "Great to meet you John! What's the best email to reach you?"
[continue collecting required fields]
You: "Let me confirm - John Smith at john@example.com and 555-1234. You need a fire alarm system for your office building. Correct?"
User: "Yes"
[Call submitContactForm with collected data]
You: "Perfect! I've submitted your info. Someone will reach out within 24 hours."

Be warm and helpful, not robotic!
```

### Click "Save"

---

## Step 4: Configure Webhook URL

### Navigate to Server Settings
```
Dashboard → Your Assistant → Server Settings / Webhook
```

### Set Webhook URL

```
https://your-domain.com/api/vapi/webhook
```

Replace `your-domain.com` with:
- `capcofire.com` (production)
- `rothcobuilt.com` (production) 
- Your Railway deployment URL
- `localhost:4321` (local dev - requires ngrok)

### Set Request Type
- Method: `POST`
- Content-Type: `application/json`

### Click "Save"

---

## Step 5: Configure Voice & Model

### Voice Settings (Recommended)
```
Dashboard → Your Assistant → Voice Tab
```

**Recommended Voice Options:**
- **Provider:** ElevenLabs or PlayHT
- **Voice:** Female, professional, friendly
- **Speed:** 1.0x (normal)
- **Stability:** 0.7 (balanced)

Example voices:
- ElevenLabs: "Bella" or "Rachel"
- PlayHT: "Ava" or "Emily"

### Model Settings
```
Dashboard → Your Assistant → Model Tab
```

**Recommended Model:**
- **Provider:** OpenAI
- **Model:** GPT-4 Turbo (or GPT-4o)
- **Temperature:** 0.7 (conversational)
- **Max Tokens:** 500 (concise responses)

---

## Step 6: Test Your Configuration

### Test in VAPI Dashboard

1. Click "Test" button in dashboard
2. Start conversation:

```
You: "I need help with a fire protection project"
```

3. Engage in conversation
4. Provide contact info when asked
5. Confirm details
6. Check that function is called

### Expected Console Logs

In your application logs (Railway or local), you should see:

```
[---VAPI-WEBHOOK] Submitting contact form: { firstName: 'John', lastName: 'Smith', ... }
✅ [VAPI-WEBHOOK] Contact form submitted successfully
```

### Verify in Database

Check your database for new contact submission:

```sql
SELECT * FROM contacts 
WHERE source = 'vapi_chat' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## Step 7: Deploy to Your Site

### Add Link to Hybrid Contact Page

In your navigation or contact links, add:

```astro
<a href="/contact-hybrid">Contact Us</a>
```

Or update existing `/contact` page to use hybrid version.

### Test User Flow

1. Visit: `https://your-domain.com/contact-hybrid`
2. Click "Chat with Leah" button
3. Have natural conversation
4. Provide contact info
5. Confirm submission
6. Verify database entry

---

## Troubleshooting

### Issue: Function not being called

**Symptoms:**
- Conversation collects info but nothing submits
- No webhook logs

**Solutions:**
1. Check system prompt includes submitContactForm instructions
2. Verify function is saved in dashboard
3. Ensure all required fields are collected
4. Try explicitly saying "Submit this" after confirmation

### Issue: Webhook errors

**Symptoms:**
- Function called but error returned
- 404 or 500 errors in VAPI logs

**Solutions:**
1. Verify webhook URL is correct
2. Check `/api/vapi/webhook` exists and is accessible
3. Review server logs for errors
4. Test webhook endpoint directly with curl:

```bash
curl -X POST https://your-domain.com/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCallList": [{
        "id": "test-123",
        "function": {
          "name": "submitContactForm",
          "arguments": "{\"firstName\":\"Test\",\"lastName\":\"User\",\"email\":\"test@example.com\",\"phone\":\"555-1234\",\"message\":\"Test message\"}"
        }
      }]
    }
  }'
```

### Issue: Wrong data format

**Symptoms:**
- Data submitted but fields are wrong/empty
- Email validation fails

**Solutions:**
1. Check VAPI conversation logs for exact transcript
2. Update system prompt to be more explicit about formats
3. Add validation examples to prompt:
   - Email: "Must include @ and .com"
   - Phone: "10 digits like 555-123-4567"

### Issue: Assistant too robotic

**Symptoms:**
- Conversations feel like interrogation
- Users drop off mid-conversation

**Solutions:**
1. Update system prompt to emphasize conversation
2. Add personality examples
3. Train to answer questions first, then collect info
4. Review conversation logs and refine

---

## Advanced Configuration

### Add User Context (if logged in)

In `VapiChatWidget.astro`, pass user metadata:

```astro
<vapi-widget
  assistant-overrides={currentUser ? JSON.stringify({
    variableValues: {
      userId: currentUser.id,
      userName: currentUser.user_metadata?.name,
      userEmail: currentUser.email,
    },
    metadata: {
      userId: currentUser.id,
      userEmail: currentUser.email,
    }
  }) : undefined}
  ...
/>
```

Your webhook receives this metadata and can pre-fill fields.

### Custom Confirmation Message

In webhook response, customize the success message:

```typescript
results.push({
  toolCallId: toolCall.id,
  result: `Perfect${name ? `, ${args.firstName}` : ""}! I've submitted your information. Someone from our team will reach out within 24 hours. ${customMessage}`,
});
```

### A/B Testing

Track which method users prefer:

```typescript
// In contact submission
{
  source: "vapi_chat",  // or "form"
  timestamp: new Date(),
  sessionId: generateSessionId(),
}
```

Query to compare:

```sql
SELECT 
  source,
  COUNT(*) as submissions,
  AVG(time_to_complete) as avg_time
FROM contacts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source;
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Completion Rate**
   - Chat: % who finish submission
   - Form: % who complete all steps

2. **Time to Complete**
   - Chat: Average conversation length
   - Form: Average time on page

3. **Drop-off Points**
   - Chat: Where users stop responding
   - Form: Which step has most abandonment

4. **User Preference**
   - Chat vs Form button clicks
   - Return user patterns

5. **Question Volume**
   - Most common questions asked in chat
   - Topics that need better documentation

### VAPI Analytics Dashboard

```
Dashboard → Your Assistant → Analytics
```

Review:
- Total conversations
- Average conversation length
- Function call success rate
- Most common user intents
- Error rates

---

## Maintenance

### Weekly Tasks
- ✅ Review conversation logs for issues
- ✅ Check webhook error rates
- ✅ Update system prompt based on common questions
- ✅ Verify contact submissions reaching database

### Monthly Tasks
- ✅ Analyze chat vs form conversion rates
- ✅ Review and refine system prompts
- ✅ Add new Q&A to assistant knowledge
- ✅ Update function definitions if needed

### Quarterly Tasks
- ✅ Comprehensive A/B test analysis
- ✅ User satisfaction surveys
- ✅ Voice/model optimization
- ✅ Add new features based on feedback

---

## Support Resources

- **VAPI Documentation:** https://docs.vapi.ai
- **VAPI Discord:** https://discord.gg/vapi
- **Your Webhook Logs:** Check Railway or local console
- **Database Queries:** Use your Supabase dashboard

---

## Checklist: Launch Readiness

Before going live, verify:

- [ ] submitContactForm function added to VAPI
- [ ] System prompt includes contact collection guidelines
- [ ] Webhook URL configured correctly
- [ ] Voice and model settings optimized
- [ ] Test conversation completed successfully
- [ ] Contact submission appeared in database
- [ ] `/contact-hybrid` page deployed
- [ ] Navigation links updated
- [ ] Error monitoring in place
- [ ] Team trained on new system

---

**Configuration Status:** Ready for deployment ✅  
**Estimated Setup Time:** 30-45 minutes  
**Next Steps:** Test thoroughly, then update your main `/contact` route to use hybrid page
