# Gmail Integration - Quick Reference

## Voice Commands

```
"Check my email"        → Lists unread emails
"Read it" / "Read the first one" → Reads email aloud
"Reply saying [message]" → Replies to current email
"Send email to [address]" → Starts new email
"Archive this"          → Archives current email
"Next email"            → Moves to next unread
```

## What Happens Automatically

During active voice session:

- ✅ Checks for new emails every 60 seconds
- ✅ Announces "important" emails only:
  - From VIP senders (configurable)
  - Contains urgent keywords
  - Labeled IMPORTANT by Gmail
- ✅ Stays silent for non-important emails

## Setup Checklist

- [ ] Install googleapis: `npm install googleapis`
- [ ] Create Google Cloud project
- [ ] Enable Gmail API
- [ ] Create OAuth credentials
- [ ] Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to `.env`
- [ ] Run database migration (create-gmail-integration-tables.sql)
- [ ] Add 5 Gmail tools to VAPI assistant
- [ ] Update VAPI system prompt with email instructions
- [ ] Test: Visit /voice-assistant-vapi
- [ ] Click "Connect Gmail"
- [ ] Say "Check my email"

## Files Modified/Created

**Created:**

- `src/lib/gmail.ts` - Gmail functions
- `src/pages/api/auth/gmail/authorize.ts`
- `src/pages/api/auth/gmail/callback.ts`
- `src/pages/api/auth/gmail/disconnect.ts`
- `src/pages/api/gmail/status.ts`
- `src/pages/api/gmail/check-new-emails.ts`
- `sql-queriers/create-gmail-integration-tables.sql`

**Modified:**

- `src/pages/api/vapi/webhook.ts` - Added Gmail tool handlers
- `src/pages/voice-assistant-vapi.astro` - Added Gmail UI & monitoring

## Environment Variables

```env
GMAIL_CLIENT_ID=your-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-secret
PUBLIC_URL=https://your-domain.com
```

## Database Tables

- `gmail_tokens` - OAuth tokens per user
- `email_preferences` - VIP senders, keywords, quiet hours
- `email_check_history` - Audit log of email checks

## Important Notes

- Gmail connection is per-user
- OAuth tokens auto-refresh
- Only "important" emails are announced during calls
- All emails visible via "check my email" command
- Privacy: Never reads content without permission

## Cost

**$0.00** - Gmail API is free for personal use (up to quotas)

## Next: Configure VIP Senders

Want certain senders always announced? Add to `email_preferences` table:

```sql
UPDATE email_preferences
SET vip_senders = ARRAY['boss@company.com', 'client@important.com']
WHERE user_id = 'your-user-id';
```

Or build a preferences UI page next!
