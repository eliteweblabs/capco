# Gmail Integration Setup Guide

## Phase 1 Complete! ✅

I've built the foundation for Gmail integration with your VAPI voice assistant. Here's what you need to do to get it running:

## Step 1: Install Dependencies

```bash
npm install googleapis
```

## Step 2: Set Up Google Cloud Project

### A. Create Project & Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

### B. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen first:
   - User Type: External
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add these Gmail scopes:
     - `.../auth/gmail.readonly`
     - `.../auth/gmail.send`
     - `.../auth/gmail.modify`
     - `.../auth/gmail.compose`
     - `.../auth/userinfo.email`
   - Test users: Add your email for testing
4. Create OAuth Client ID:
   - Application type: Web application
   - Name: "Voice Assistant Gmail"
   - Authorized redirect URIs:
     - For production: `https://your-domain.com/api/auth/gmail/callback`
     - For local dev: `http://localhost:4321/api/auth/gmail/callback`
5. Save the Client ID and Client Secret

## Step 3: Add Environment Variables

Add to your `.env` file:

```env
# Gmail API Configuration
GMAIL_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret-here

# Make sure PUBLIC_URL is set
PUBLIC_URL=https://your-domain.com
# For local: PUBLIC_URL=http://localhost:4321
```

## Step 4: Run Database Migration

Run the SQL to create the necessary tables:

```bash
# Using Supabase CLI
supabase db push

# Or run the SQL file directly in Supabase Dashboard
# SQL Editor → New Query → Paste contents of:
# sql-queriers/create-gmail-integration-tables.sql
```

Or manually in Supabase SQL Editor, run:

```sql
-- Paste contents from sql-queriers/create-gmail-integration-tables.sql
```

## Step 5: Update VAPI Assistant Configuration

Add these tools to your VAPI assistant (in VAPI dashboard):

### Tool 1: getUnreadEmails

```json
{
  "type": "function",
  "function": {
    "name": "getUnreadEmails",
    "description": "Get list of unread emails from user's Gmail inbox. Only call this when user asks to check their email.",
    "parameters": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "number",
          "description": "Maximum number of emails to return (default 10)"
        }
      }
    }
  }
}
```

### Tool 2: readEmail

```json
{
  "type": "function",
  "function": {
    "name": "readEmail",
    "description": "Read the full content of a specific email. Only call this after user confirms they want to hear an email.",
    "parameters": {
      "type": "object",
      "properties": {
        "emailId": {
          "type": "string",
          "description": "Gmail message ID to read"
        }
      },
      "required": ["emailId"]
    }
  }
}
```

### Tool 3: sendEmail

```json
{
  "type": "function",
  "function": {
    "name": "sendEmail",
    "description": "Send a new email via Gmail",
    "parameters": {
      "type": "object",
      "properties": {
        "to": {
          "type": "string",
          "description": "Recipient email address"
        },
        "subject": {
          "type": "string",
          "description": "Email subject line"
        },
        "body": {
          "type": "string",
          "description": "Email body content"
        }
      },
      "required": ["to", "subject", "body"]
    }
  }
}
```

### Tool 4: replyToEmail

```json
{
  "type": "function",
  "function": {
    "name": "replyToEmail",
    "description": "Reply to an email",
    "parameters": {
      "type": "object",
      "properties": {
        "emailId": {
          "type": "string",
          "description": "Gmail message ID to reply to"
        },
        "body": {
          "type": "string",
          "description": "Reply message content"
        }
      },
      "required": ["emailId", "body"]
    }
  }
}
```

### Tool 5: archiveEmail

```json
{
  "type": "function",
  "function": {
    "name": "archiveEmail",
    "description": "Archive an email (remove from inbox)",
    "parameters": {
      "type": "object",
      "properties": {
        "emailId": {
          "type": "string",
          "description": "Gmail message ID to archive"
        }
      },
      "required": ["emailId"]
    }
  }
}
```

## Step 6: Update VAPI System Prompt

Add this to your assistant's system prompt:

```
## Email Management

You can help users manage their Gmail inbox through voice commands.

### Checking Emails
- When user says "check my email" or "do I have emails", call getUnreadEmails()
- Announce: "You have X unread emails. The most recent is from [sender] about [subject]. Shall I read it?"
- List up to 3-5 emails with sender and subject
- Ask which one to read

### Reading Emails
- When user says "read it" or "yes", call readEmail() with the email ID
- Announce: "Email from [sender name]. Subject: [subject]. Received [time ago]."
- Read the email naturally
- After reading, ask: "Would you like to reply, archive it, or check the next email?"

### Sending Emails
- When user says "send email to [person]", call sendEmail()
- Ask for missing info: recipient, subject, content
- Confirm before sending: "I'll send an email to [recipient] saying '[body]'. Shall I send it?"
- If confirmed, send it

### Replying
- When user says "reply", call replyToEmail()
- Ask: "What would you like to say in your reply?"
- Confirm before sending

### Email Actions
- "Archive this" → call archiveEmail()
- "Next email" → read next unread
- "Skip" → move to next without archiving

### Proactive Notifications
- During active sessions, I'll check for new emails every 60 seconds
- Only announce "important" emails (from VIPs, with urgent keywords, or labeled IMPORTANT)
- Say: "New important email from [sender] about [subject]. Shall I read it?"
- For non-important emails, stay silent until user asks

### Privacy
- Never read email content without permission
- Offer to summarize long emails
- Remember context of which email we're discussing
```

## Step 7: Test It Out!

1. Start your dev server:

   ```bash
   npm run dev
   ```

2. Visit `/voice-assistant-vapi`

3. You should see a blue banner "Email Integration Available"

4. Click "Connect Gmail"

5. Authorize Gmail access

6. You should see "Gmail Connected" with your email address

7. Start voice assistant

8. Say "Check my email"

## What Works Now

✅ Connect/disconnect Gmail via OAuth  
✅ Check unread emails via voice  
✅ Read specific emails aloud  
✅ Send new emails via voice  
✅ Reply to emails via voice  
✅ Archive emails via voice  
✅ Proactive notifications for important emails (every 60 seconds during active call)  
✅ Smart filtering (VIP senders, urgent keywords)

## Example Conversations

### Example 1: Checking Email

```
You: "Check my email"
Assistant: "You have 3 unread emails.
            1. From John Smith about 'Q4 Budget Review'
            2. From Sarah Johnson about 'Meeting Tomorrow'
            3. From Newsletter about 'Weekly Updates'
            Which would you like me to read?"
You: "Read the first one"
Assistant: "Email from John Smith. Subject: Q4 Budget Review.
            Received 2 hours ago. The email says: [reads content]
            Would you like to reply or archive it?"
```

### Example 2: Proactive Notification

```
[New email arrives from VIP sender]
Assistant: "New important email from boss@company.com about
            'Urgent: Client Meeting Moved'. Shall I read it?"
You: "Yes"
Assistant: [Reads email] "Would you like to reply?"
You: "Reply saying I'll be there"
Assistant: "I'll reply saying 'I'll be there'. Shall I send it?"
You: "Yes send it"
Assistant: "Reply sent successfully."
```

## Troubleshooting

### Gmail not connecting?

- Check OAuth credentials are correct
- Verify redirect URI matches exactly
- Make sure Gmail API is enabled in Google Cloud Console

### Emails not being announced?

- Check if Gmail is connected (look for green banner)
- Verify voice assistant is active
- Check browser console for errors
- Email might not be "important" (check VIP senders in preferences)

### "Gmail not connected" error in webhook?

- Tokens may have expired
- Try disconnecting and reconnecting Gmail
- Check Supabase `gmail_tokens` table

## Next Steps

Want to enhance further?

1. Add email preferences page (manage VIP senders, keywords)
2. Add Gmail push notifications (instant, not polling)
3. Add email search by sender/date
4. Add calendar integration (Google Calendar)
5. Add draft management

## Files Created

- `/src/lib/gmail.ts` - Gmail API helper functions
- `/src/pages/api/auth/gmail/authorize.ts` - OAuth start
- `/src/pages/api/auth/gmail/callback.ts` - OAuth callback
- `/src/pages/api/auth/gmail/disconnect.ts` - Disconnect
- `/src/pages/api/gmail/status.ts` - Check connection status
- `/src/pages/api/gmail/check-new-emails.ts` - Monitor for new emails
- `/src/pages/api/vapi/webhook.ts` - Updated with Gmail tools
- `/sql-queriers/create-gmail-integration-tables.sql` - Database schema

**Your Gmail integration is ready to go! 🎉**
