# VAPI Email/Gmail Integration - Implementation Guide

## Your Vision

**"When a new email arrives, the agent says 'new email from user@email.com, shall I read it?'"**

**Status: ✅ TOTALLY ACHIEVABLE**

This is NOT a pipedream. This is a real, practical use case that many voice assistants already do.

## What's Possible

### ✅ Definitely Achievable

1. **Email Monitoring**
   - Monitor Gmail for new emails in real-time
   - Proactively notify you via voice when email arrives
   - Read email content aloud
   - Summarize long emails
   - Filter by importance/sender

2. **Email Actions**
   - Send new emails via voice
   - Reply to emails via voice
   - Forward emails
   - Archive, delete, mark as read/unread
   - Search emails by sender, subject, date
   - Add labels/categories

3. **Smart Notifications**
   - "New email from john@company.com about 'Project Update'"
   - "You have 3 unread emails, 1 is marked urgent"
   - "Email from your boss just arrived"
   - Only announce "important" emails (configurable)

4. **Interactive Conversations**
   - "Shall I read it?" → "Yes" → Reads email
   - "Reply saying I'll review it tomorrow"
   - "Archive this and go to the next email"
   - "Forward this to Sarah"

## Architecture

### Option 1: During Active VAPI Call (Recommended to Start)

```
┌──────────────────────────────────────────────────────────┐
│ User starts voice assistant                              │
│ "I'm working, notify me of important emails"            │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ Backend polls Gmail API every 30-60 seconds              │
│ Checks for new emails since last check                   │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ New email detected                                       │
│ • Check if "important" (filtering rules)                 │
│ • If important: Send to VAPI                             │
│ • If not: Store for later/"check email" command          │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ VAPI announces                                           │
│ "New email from john@company.com about Q4 Budget        │
│  Approval Needed. Shall I read it?"                      │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ User: "Yes, read it"                                     │
└────────────────────┬─────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ VAPI calls readEmail tool → Reads content aloud          │
└──────────────────────────────────────────────────────────┘
```

### Option 2: Gmail Push Notifications (Advanced)

For proactive notifications even when assistant isn't running:

```
Gmail → Google Pub/Sub → Your Webhook → 
  → Browser Notification OR Start VAPI Call
```

## Implementation Plan

### Phase 1: Gmail API Setup (Day 1-2)

#### Step 1: Enable Gmail API

1. Go to Google Cloud Console
2. Create new project or use existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.com/api/auth/gmail/callback`

#### Step 2: Required Scopes

```
https://www.googleapis.com/auth/gmail.readonly  # Read emails
https://www.googleapis.com/auth/gmail.send      # Send emails  
https://www.googleapis.com/auth/gmail.modify    # Archive, mark as read
```

### Phase 2: Database Schema (Day 2)

Store OAuth tokens securely:

```sql
CREATE TABLE gmail_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  vip_senders TEXT[] DEFAULT '{}',
  blocked_senders TEXT[] DEFAULT '{}',
  announce_all BOOLEAN DEFAULT FALSE,
  urgent_keywords TEXT[] DEFAULT ARRAY['urgent', 'asap', 'important'],
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: Gmail OAuth Flow (Day 3)

```typescript
// src/pages/api/auth/gmail/authorize.ts
export const GET: APIRoute = async ({ cookies, redirect }) => {
  const { currentUser } = await checkAuth(cookies);
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.PUBLIC_URL}/api/auth/gmail/callback`
  );
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
    ],
    state: currentUser.id, // Pass user ID
  });
  
  return redirect(authUrl);
};

// src/pages/api/auth/gmail/callback.ts
export const GET: APIRoute = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // user ID
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.PUBLIC_URL}/api/auth/gmail/callback`
  );
  
  const { tokens } = await oauth2Client.getToken(code);
  
  // Store tokens in database
  await supabase.from('gmail_tokens').upsert({
    user_id: state,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expiry_date),
    scope: tokens.scope.split(' '),
  });
  
  return redirect('/voice-assistant-vapi?gmail=connected');
};
```

### Phase 4: Gmail Helper Functions (Day 3-4)

```typescript
// src/lib/gmail.ts
import { google } from 'googleapis';

export async function getGmailClient(userId: string) {
  // Get tokens from database
  const { data: tokenData } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!tokenData) {
    throw new Error('Gmail not connected');
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.PUBLIC_URL}/api/auth/gmail/callback`
  );
  
  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.expires_at).getTime(),
  });
  
  // Auto-refresh tokens
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await supabase.from('gmail_tokens').update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date),
        updated_at: new Date(),
      }).eq('user_id', userId);
    }
  });
  
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

export async function getUnreadEmails(userId: string, limit = 10) {
  const gmail = await getGmailClient(userId);
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    maxResults: limit,
  });
  
  if (!response.data.messages) {
    return [];
  }
  
  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
      });
      
      const headers = email.data.payload?.headers || [];
      
      return {
        id: email.data.id!,
        threadId: email.data.threadId!,
        from: headers.find(h => h.name === 'From')?.value || '',
        to: headers.find(h => h.name === 'To')?.value || '',
        subject: headers.find(h => h.name === 'Subject')?.value || '(No subject)',
        date: headers.find(h => h.name === 'Date')?.value || '',
        snippet: email.data.snippet || '',
        labelIds: email.data.labelIds || [],
      };
    })
  );
  
  return emails;
}

export async function readEmail(userId: string, emailId: string) {
  const gmail = await getGmailClient(userId);
  
  const email = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
    format: 'full',
  });
  
  const headers = email.data.payload?.headers || [];
  
  // Extract email body
  const body = extractEmailBody(email.data.payload);
  
  return {
    id: email.data.id!,
    from: headers.find(h => h.name === 'From')?.value || '',
    subject: headers.find(h => h.name === 'Subject')?.value || '',
    date: headers.find(h => h.name === 'Date')?.value || '',
    body: body,
    snippet: email.data.snippet || '',
  };
}

function extractEmailBody(payload: any): string {
  if (!payload) return '';
  
  // If plain text body
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  
  // If HTML body  
  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    // Strip HTML tags (simple version, consider using a library)
    return html.replace(/<[^>]*>/g, '').trim();
  }
  
  // If multipart, recursively search for text/plain or text/html
  if (payload.parts) {
    for (const part of payload.parts) {
      const body = extractEmailBody(part);
      if (body) return body;
    }
  }
  
  return '';
}

export async function sendEmail(userId: string, to: string, subject: string, body: string) {
  const gmail = await getGmailClient(userId);
  
  const email = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\n');
  
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });
}

export async function replyToEmail(userId: string, emailId: string, replyBody: string) {
  const gmail = await getGmailClient(userId);
  
  // Get original email for threading
  const original = await gmail.users.messages.get({
    userId: 'me',
    id: emailId,
  });
  
  const headers = original.data.payload?.headers || [];
  const originalFrom = headers.find(h => h.name === 'From')?.value || '';
  const originalSubject = headers.find(h => h.name === 'Subject')?.value || '';
  const messageId = headers.find(h => h.name === 'Message-ID')?.value || '';
  
  const replySubject = originalSubject.startsWith('Re:') 
    ? originalSubject 
    : `Re: ${originalSubject}`;
  
  const email = [
    `To: ${originalFrom}`,
    `Subject: ${replySubject}`,
    `In-Reply-To: ${messageId}`,
    `References: ${messageId}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    replyBody,
  ].join('\n');
  
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
      threadId: original.data.threadId,
    },
  });
}

export async function archiveEmail(userId: string, emailId: string) {
  const gmail = await getGmailClient(userId);
  
  await gmail.users.messages.modify({
    userId: 'me',
    id: emailId,
    requestBody: {
      removeLabelIds: ['INBOX'],
    },
  });
}

export async function markAsRead(userId: string, emailId: string) {
  const gmail = await getGmailClient(userId);
  
  await gmail.users.messages.modify({
    userId: 'me',
    id: emailId,
    requestBody: {
      removeLabelIds: ['UNREAD'],
    },
  });
}
```

### Phase 5: VAPI Tools (Day 4-5)

Create webhook handlers for VAPI tools:

```typescript
// Add to src/pages/api/vapi/webhook.ts

else if (functionName === "getUnreadEmails") {
  const args = parseArgs(toolCall);
  
  console.log(`[VAPI-WEBHOOK] Getting unread emails`);
  
  const userId = callMetadata?.userId;
  if (!userId) {
    results.push({
      toolCallId: toolCall.id,
      result: "I need you to be logged in to check your email.",
    });
    continue;
  }
  
  try {
    const emails = await getUnreadEmails(userId, args.limit || 10);
    
    if (emails.length === 0) {
      results.push({
        toolCallId: toolCall.id,
        result: "You have no unread emails. Your inbox is clear!",
      });
    } else {
      const emailList = emails.map((e, i) => 
        `${i + 1}. From ${extractName(e.from)} about "${e.subject}"`
      ).join('. ');
      
      results.push({
        toolCallId: toolCall.id,
        result: `You have ${emails.length} unread email${emails.length > 1 ? 's' : ''}. ${emailList}. Which would you like me to read?`,
      });
    }
  } catch (error: any) {
    console.error(`[VAPI-WEBHOOK] Error getting emails:`, error);
    results.push({
      toolCallId: toolCall.id,
      result: error.message.includes('Gmail not connected')
        ? "You need to connect your Gmail account first. Please visit the settings page."
        : "I'm having trouble accessing your email right now. Please try again.",
    });
  }
  
  continue;
}

else if (functionName === "readEmail") {
  const args = parseArgs(toolCall);
  const userId = callMetadata?.userId;
  
  if (!userId) {
    results.push({
      toolCallId: toolCall.id,
      result: "I need you to be logged in to read emails.",
    });
    continue;
  }
  
  try {
    const email = await readEmail(userId, args.emailId);
    
    // Mark as read after fetching
    await markAsRead(userId, args.emailId);
    
    const result = [
      `Email from ${extractName(email.from)}.`,
      `Subject: ${email.subject}.`,
      `Received ${formatDate(email.date)}.`,
      ``,
      email.body,
    ].join(' ');
    
    results.push({
      toolCallId: toolCall.id,
      result: result,
    });
  } catch (error: any) {
    console.error(`[VAPI-WEBHOOK] Error reading email:`, error);
    results.push({
      toolCallId: toolCall.id,
      result: "I couldn't read that email. It may have been deleted or archived.",
    });
  }
  
  continue;
}

else if (functionName === "sendEmail") {
  const args = parseArgs(toolCall);
  const userId = callMetadata?.userId;
  
  if (!userId) {
    results.push({
      toolCallId: toolCall.id,
      result: "I need you to be logged in to send emails.",
    });
    continue;
  }
  
  try {
    await sendEmail(userId, args.to, args.subject, args.body);
    
    results.push({
      toolCallId: toolCall.id,
      result: `Email sent to ${args.to} successfully.`,
    });
  } catch (error: any) {
    console.error(`[VAPI-WEBHOOK] Error sending email:`, error);
    results.push({
      toolCallId: toolCall.id,
      result: "I couldn't send that email. Please check the recipient address and try again.",
    });
  }
  
  continue;
}

else if (functionName === "replyToEmail") {
  const args = parseArgs(toolCall);
  const userId = callMetadata?.userId;
  
  if (!userId) {
    results.push({
      toolCallId: toolCall.id,
      result: "I need you to be logged in to reply to emails.",
    });
    continue;
  }
  
  try {
    await replyToEmail(userId, args.emailId, args.body);
    
    results.push({
      toolCallId: toolCall.id,
      result: `Reply sent successfully.`,
    });
  } catch (error: any) {
    console.error(`[VAPI-WEBHOOK] Error replying to email:`, error);
    results.push({
      toolCallId: toolCall.id,
      result: "I couldn't send that reply. The email may have been deleted.",
    });
  }
  
  continue;
}

else if (functionName === "archiveEmail") {
  const args = parseArgs(toolCall);
  const userId = callMetadata?.userId;
  
  if (!userId) {
    results.push({
      toolCallId: toolCall.id,
      result: "I need you to be logged in to archive emails.",
    });
    continue;
  }
  
  try {
    await archiveEmail(userId, args.emailId);
    
    results.push({
      toolCallId: toolCall.id,
      result: `Email archived successfully.`,
    });
  } catch (error: any) {
    console.error(`[VAPI-WEBHOOK] Error archiving email:`, error);
    results.push({
      toolCallId: toolCall.id,
      result: "I couldn't archive that email.",
    });
  }
  
  continue;
}
```

### Phase 6: VAPI System Prompt (Day 5)

Update your VAPI assistant's system prompt:

```
## Email Management

You can help the user manage their Gmail inbox through voice commands.

### Checking Emails

When user says "check my email" or "do I have any emails":
1. Call getUnreadEmails() to fetch recent unread emails
2. If no emails: "You have no unread emails. Your inbox is clear!"
3. If emails: "You have X unread emails. The most recent is from [sender] about [subject]. Shall I read it?"
4. For multiple emails, list first 3-5 with sender and subject
5. Ask which one to read: "Which email would you like me to read?"

### Reading Emails

When user says "read it", "read the first one", or specifies an email:
1. Call readEmail(emailId) with the appropriate email ID
2. Announce: "Email from [sender name]. Subject: [subject]. Received [time ago]."
3. Read the email body naturally
4. For long emails (>200 words), offer to summarize: "This is a long email. Would you like me to summarize it?"
5. After reading, ask: "Would you like to reply, archive it, or check the next email?"

### Composing & Sending Emails

When user says "send email to [person]" or "compose email":
1. Ask for recipient if not provided: "Who would you like to send this email to?"
2. Ask for subject: "What's the subject?"
3. Ask for content: "What would you like to say?"
4. Confirm before sending: "I'll send an email to [recipient] with subject '[subject]' saying '[body]'. Shall I send it?"
5. If confirmed, call sendEmail()
6. Confirm: "Email sent successfully to [recipient]"

### Replying to Emails

When user says "reply" or "respond":
1. Make sure you know which email to reply to (from recent readEmail call)
2. Ask for reply content: "What would you like to say in your reply?"
3. Compose natural reply
4. Confirm: "I'll reply saying '[reply]'. Shall I send it?"
5. If confirmed, call replyToEmail()
6. Confirm: "Reply sent successfully"

### Email Actions

- "Archive this email" → call archiveEmail()
- "Next email" → read next unread email
- "Skip this" → move to next email without archiving
- "Mark as read" → mark email as read
- "Go back" → return to previous email

### Proactive Notifications (During Active Session)

While user is working with voice assistant active:
- Silently check for new emails every 60 seconds
- Only announce emails marked as "important":
  - From VIP senders (user's configured list)
  - Contains urgent keywords ("urgent", "asap", "critical")
  - Labeled as IMPORTANT by Gmail
  - Is a reply to user's sent email
- Announce: "New email from [sender] about [subject]. It's marked as urgent. Shall I read it?"
- If user says "not now" or "later", don't announce it again
- For non-important emails, stay silent - user can check manually

### Privacy & Context

- Never read email content aloud without explicit permission
- If others are present, offer to summarize instead: "Would you like me to summarize this email, or would you prefer to read it yourself later?"
- Remember which email is currently being discussed (context management)
- Track conversation flow: reading → replying → archiving sequence

### Error Handling

- If Gmail not connected: "You need to connect your Gmail account first. Please visit the settings page to authorize access."
- If email not found: "I couldn't find that email. It may have been deleted or archived."
- If send fails: "I couldn't send that email. Please check the recipient address."

### Natural Language Understanding

Understand variations:
- "Check mail" / "Any emails?" / "What's in my inbox?"
- "Read it" / "What does it say?" / "Tell me what they said"
- "Reply yes" / "Tell them yes" / "Say I agree"
- "Delete it" / "Get rid of this" / "Trash this email"
- "Who's that from?" / "When did they send it?" / "What's it about?"
```

### Phase 7: Email Monitoring During Active Call (Day 6)

Add periodic email checking:

```typescript
// src/pages/api/vapi/check-new-emails.ts
export const POST: APIRoute = async ({ request }) => {
  const { userId, lastCheckTimestamp } = await request.json();
  
  try {
    const gmail = await getGmailClient(userId);
    
    // Get emails since last check
    const query = `is:unread after:${Math.floor(lastCheckTimestamp / 1000)}`;
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10,
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      return new Response(JSON.stringify({ newEmails: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch full email details
    const emails = await Promise.all(
      response.data.messages.map(async (msg) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
        });
        
        const headers = email.data.payload?.headers || [];
        
        return {
          id: email.data.id!,
          from: headers.find(h => h.name === 'From')?.value || '',
          subject: headers.find(h => h.name === 'Subject')?.value || '',
          snippet: email.data.snippet || '',
          labelIds: email.data.labelIds || [],
        };
      })
    );
    
    // Filter for important emails only
    const { data: prefs } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    const importantEmails = emails.filter(email => 
      isImportantEmail(email, prefs)
    );
    
    return new Response(JSON.stringify({ 
      newEmails: importantEmails 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[EMAIL-CHECK] Error:', error);
    return new Response(JSON.stringify({ 
      newEmails: [],
      error: error.message 
    }), {
      status: 200, // Return 200 to not break VAPI call
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function isImportantEmail(email: any, prefs: any): boolean {
  // Check VIP senders
  if (prefs?.vip_senders?.some((vip: string) => 
    email.from.toLowerCase().includes(vip.toLowerCase())
  )) {
    return true;
  }
  
  // Check urgent keywords
  const urgentKeywords = prefs?.urgent_keywords || ['urgent', 'asap', 'critical'];
  const subjectLower = email.subject.toLowerCase();
  if (urgentKeywords.some((keyword: string) => subjectLower.includes(keyword))) {
    return true;
  }
  
  // Check if labeled as IMPORTANT by Gmail
  if (email.labelIds.includes('IMPORTANT')) {
    return true;
  }
  
  return false;
}
```

Then in your voice assistant page, add periodic checking:

```javascript
// src/pages/voice-assistant-vapi.astro
let emailCheckInterval = null;
let lastEmailCheck = Date.now();

function startEmailMonitoring() {
  // Check for new emails every 60 seconds
  emailCheckInterval = setInterval(async () => {
    if (!isCallActive) return;
    
    try {
      const response = await fetch('/api/vapi/check-new-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: currentUser?.id,
          lastCheckTimestamp: lastEmailCheck,
        }),
      });
      
      const { newEmails } = await response.json();
      
      if (newEmails && newEmails.length > 0) {
        // Send notification to VAPI
        newEmails.forEach((email) => {
          vapi.send({
            type: 'add-message',
            message: {
              role: 'system',
              content: `New important email from ${email.from} about "${email.subject}". Shall I read it?`,
            },
          });
        });
      }
      
      lastEmailCheck = Date.now();
      
    } catch (error) {
      console.error('[EMAIL-MONITOR] Error:', error);
    }
  }, 60000); // Every 60 seconds
}

function stopEmailMonitoring() {
  if (emailCheckInterval) {
    clearInterval(emailCheckInterval);
    emailCheckInterval = null;
  }
}

// Start monitoring when call starts
vapi.on('call-start', () => {
  // ... existing code ...
  startEmailMonitoring();
});

// Stop monitoring when call ends
vapi.on('call-end', () => {
  // ... existing code ...
  stopEmailMonitoring();
});
```

## Example User Interactions

### Example 1: Checking Emails

```
User: "Check my email"