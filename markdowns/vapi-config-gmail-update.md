# VAPI Gmail Integration Update Guide

**Date**: 2026-01-30  
**Status**: ⏳ In Progress - Needs Tool IDs

## Overview

Updated the VAPI assistant configuration script to include Gmail integration. The assistant can now:
- Proactively announce new important emails during voice calls
- Check unread emails
- Read email content
- Send new emails
- Reply to emails
- Archive emails

## Files Modified

- ✅ `scripts/vapi-capco-config.js` - Updated system prompt and added Gmail tool placeholders

## Steps to Complete Integration

### Step 1: Get Gmail Tool IDs from VAPI Dashboard ⏳

After creating the 5 Gmail tools in VAPI dashboard, you need to get their IDs:

1. Go to: https://dashboard.vapi.ai/
2. Navigate to: Tools
3. Find each Gmail tool and copy its ID
4. The IDs will look like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

You need IDs for:
- `getUnreadEmails`
- `readEmail`
- `sendEmail`
- `replyToEmail`
- `archiveEmail`

### Step 2: Update the Script with Tool IDs

Edit `/scripts/vapi-capco-config.js` around line 308-315:

**Replace this:**
```javascript
toolIds: [
  "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule
  "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment
  // TODO: Add Gmail tool IDs after creating them in VAPI dashboard
  // "TOOL_ID_HERE", // getUnreadEmails()
  // "TOOL_ID_HERE", // readEmail(emailId)
  // "TOOL_ID_HERE", // sendEmail(to, subject, body)
  // "TOOL_ID_HERE", // replyToEmail(emailId, body)
  // "TOOL_ID_HERE", // archiveEmail(emailId)
],
```

**With actual IDs:**
```javascript
toolIds: [
  "0b17d3bc-a697-432b-8386-7ed1235fd111", // getStaffSchedule
  "5b8ac059-9bbe-4a27-985d-70df87f9490d", // bookAppointment
  "YOUR_TOOL_ID_HERE", // getUnreadEmails()
  "YOUR_TOOL_ID_HERE", // readEmail(emailId)
  "YOUR_TOOL_ID_HERE", // sendEmail(to, subject, body)
  "YOUR_TOOL_ID_HERE", // replyToEmail(emailId, body)
  "YOUR_TOOL_ID_HERE", // archiveEmail(emailId)
],
```

### Step 3: Run the Update Script

Once the tool IDs are added, run the script to update VAPI:

```bash
cd /Users/4rgd/Astro/astro-supabase-main
node scripts/vapi-capco-config.js
```

Expected output:
```
🤖 [VAPI-CAPCO] Updating Vapi.ai assistant: 3ae002d5-fe9c-4870-8034-4c66a9b43b51
🔄 [VAPI-CAPCO] Processed placeholders in configuration
📝 [VAPI-CAPCO] Company name set to: "CAPCO Design Group"
✅ [VAPI-CAPCO] Assistant updated successfully
✅ [VAPI-CAPCO] Configuration complete!
```

### Step 4: Test the Integration

1. Go to: https://cowardly-duck-66.loca.lt/voice-assistant-vapi
2. Click "Start Voice Assistant"
3. Say: **"Check my email"**
4. The assistant should call `getUnreadEmails()` and read your emails

## What Changed in the System Prompt

### Added Email Management Section

The new prompt includes:

1. **Email Monitoring**: Automatic proactive announcements during calls
2. **Checking Email**: Commands like "check my email"
3. **Reading Email**: Commands like "read that email"
4. **Sending Email**: Commands like "send an email to [person]"
5. **Replying to Email**: Commands like "reply to that"
6. **Archiving Email**: Commands like "archive that"

### Example Conversation Flow

**User**: "Check my email"  
**Assistant**: *Calls getUnreadEmails()* "You have 3 unread emails. The first is from John Smith about 'Project Update'..."

**User**: "Read the first one"  
**Assistant**: *Calls readEmail(emailId)* "The email from John says: 'Hi, just wanted to update you on the project status...'" *Pause* "Would you like me to reply to this or archive it?"

**User**: "Reply and say thanks for the update"  
**Assistant**: *Calls replyToEmail(emailId, body)* "Your reply has been sent successfully. Is there anything else I can help you with?"

### Proactive Email Notifications

When emails arrive during an active call:

1. Frontend monitors Gmail every 60 seconds
2. Detects new important emails
3. Sends notification to VAPI
4. VAPI assistant announces: "New email from Sarah Johnson about 'Urgent: Fire Alarm Inspection'. Shall I read it?"

## Environment Variables Required

Make sure these are set in `.env`:

```env
# VAPI Configuration
VAPI_API_KEY=77cb0a47-2427-44ac-996d-e6ed2ca03bbf
PUBLIC_VAPI_KEY=77cb0a47-2427-44ac-996d-e6ed2ca03bbf
PUBLIC_VAPI_ASSISTANT_ID=3ae002d5-fe9c-4870-8034-4c66a9b43b51

# Gmail API Configuration
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here
PUBLIC_URL=http://localhost:4321

# Railway Domain (for production)
RAILWAY_PUBLIC_DOMAIN=capcofire.com
```

## Troubleshooting

### Script fails with "VAPI_API_KEY not found"
- Check that `VAPI_API_KEY` is set in `.env`
- Make sure `.env` file is in the project root

### Assistant not calling Gmail tools
- Verify tool IDs are correct in `toolIds` array
- Check that tools are enabled in VAPI dashboard
- Confirm webhook URL is correct in each tool definition

### "Check my email" command not working
- Ensure Gmail is connected (click "Connect Gmail" in voice assistant page)
- Run the SQL migration to create `gmail_tokens` table
- Check Supabase logs for any errors

## Next Steps

1. ⏳ Get the 5 Gmail tool IDs from VAPI dashboard
2. ⏳ Update `toolIds` array with actual IDs
3. ⏳ Run `node scripts/vapi-capco-config.js`
4. ⏳ Test "check my email" command
5. ⏳ Test proactive email notifications

## Related Files

- `/scripts/vapi-capco-config.js` - Main configuration script
- `/src/lib/vapi-capco-config.ts` - TypeScript config (reference only, not used by script)
- `/src/pages/voice-assistant-vapi.astro` - Frontend with email monitoring
- `/src/pages/api/vapi/webhook.ts` - Webhook handler for tool calls
- `/src/lib/gmail.ts` - Gmail API integration library

## Documentation

- [Gmail Integration Guide](./gmail-setup-instructions.md)
- [VAPI Setup Instructions](./vapi-gmail-integration-guide.md)
- [Gmail Quick Start](./vapi-gmail-quick-start.md)
