# VAPI Configuration Analysis - Root Cause Found

**Date**: January 30, 2026

## Root Cause Identified

The assistant ID `3ae002d5-fe9c-4870-8034-4c66a9b43b51` in your `.env` is configured in `scripts/vapi-capco-config.js` as a **PHONE-ONLY assistant**.

### Evidence from vapi-capco-config.js:

```javascript
// Line 71
const ASSISTANT_ID = "3ae002d5-fe9c-4870-8034-4c66a9b43b51";

// Lines 313-316 - Voice configuration (phone only)
voice: {
  provider: "vapi",
  voiceId: "Kylie",
},

// Line 317 - First message (for phone calls)
firstMessage: "Thank you for calling {{COMPANY_NAME}}..."
```

This assistant is designed for **inbound/outbound phone calls**, not web chat. That's why the `/chat/web` endpoint returns 403 Forbidden.

## Solution Options

### Option 1: Create a NEW Web-Only Assistant (RECOMMENDED)

Create a separate assistant specifically for web chat:

1. **In VAPI Dashboard:**
   - Create new assistant
   - Name it "CAPCO Web Chat Assistant"
   - Select **"Web"** as the channel (not "Phone")
   - Configure with similar settings but for chat

2. **Update .env:**
   ```bash
   # Keep existing phone assistant
   VAPI_PHONE_ASSISTANT_ID=3ae002d5-fe9c-4870-8034-4c66a9b43b51
   
   # Add new web chat assistant
   PUBLIC_VAPI_ASSISTANT_ID=<NEW_WEB_ASSISTANT_ID>
   ```

### Option 2: Enable Web on Existing Assistant (IF SUPPORTED)

Contact VAPI support to enable web channel on existing assistant:
- Email: support@vapi.ai
- Ask to enable "web/chat channel" for assistant `3ae002d5-fe9c-4870-8034-4c66a9b43b51`
- Note: This may not be possible if phone-only assistants can't be converted

### Option 3: Use VAPI for Phone Only, Different Service for Web Chat

Keep VAPI for phone calls, use a different chat service for web:
- Intercom
- Drift
- Custom chat with OpenAI API
- Crisp

## Recommendation

**Create a NEW web chat assistant** (Option 1). This gives you:
- ✅ Clean separation between phone and web channels
- ✅ Different conversation flows optimized for each channel
- ✅ No risk of breaking existing phone functionality
- ✅ Ability to customize web experience independently

## Implementation Steps

1. Create new assistant in VAPI dashboard with "Web" channel
2. Copy the new assistant ID
3. Update `.env`:
   ```bash
   PUBLIC_VAPI_ASSISTANT_ID=<new-web-assistant-id>
   ```
4. Restart your dev server
5. Test the web widget

The updated `VapiChatWidget.astro` component is already ready to use the new web assistant.
