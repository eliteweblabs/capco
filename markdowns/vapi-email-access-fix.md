# VAPI Email Access Fix

## Problem
When asking the VAPI chat agent to "check my mail", it responds with "can't check due to a login issue."

## Root Cause
The VAPI widget was only shown to **non-logged-in users** (`!currentUser` condition in App.astro line 675). This meant:
1. Users who could access their email (logged-in users) couldn't see the widget
2. Users who could see the widget (not logged in) had no user ID to pass to the email tools
3. The webhook requires `callMetadata.userId` to access Gmail via the user's account

## Solution
Updated the VAPI widget to:
1. **Show to all users** (removed the `!currentUser` condition)
2. **Pass user metadata** when user is logged in via `assistant-overrides` attribute
3. **Include userId, userName, and userEmail** in both `variableValues` and `metadata`

## Changes Made

### 1. VapiChatWidget.astro
Added `currentUser` prop and configured assistant overrides:

```astro
interface Props {
  // ... other props
  currentUser?: any;
}

<vapi-widget
  assistant-overrides={currentUser ? JSON.stringify({
    variableValues: {
      userId: currentUser.id,
      userName: currentUser.user_metadata?.name || currentUser.email,
      userEmail: currentUser.email,
    },
    metadata: {
      userId: currentUser.id,
      userName: currentUser.user_metadata?.name || currentUser.email,
      userEmail: currentUser.email,
    }
  }) : undefined}
  ...
/>
```

### 2. App.astro
Updated to:
- Show widget to ALL users (not just non-logged-in)
- Pass `currentUser` prop to the widget

```astro
{
  !isBackend && !isAuthPageResult && !isContactPageResult && (
    <VapiChatWidget basic={true} currentUser={currentUser} />
  )
}
```

## How It Works Now

### For Logged-In Users:
1. User opens chat widget
2. Widget includes user metadata in VAPI call
3. VAPI passes metadata to webhook via `call.metadata`
4. Webhook extracts `userId` from metadata
5. Gmail functions use `userId` to access user's Gmail via stored OAuth tokens
6. Assistant can now check email, read emails, reply, etc.

### For Non-Logged-In Users:
1. Widget still works for general inquiries
2. Email-related requests will inform user they need to log in
3. Appointment booking still works (doesn't require login)

## Email Tools Available

The assistant has these Gmail tools configured:
1. **getUnreadEmails** - List unread emails
2. **readEmail** - Read a specific email
3. **replyToEmail** - Reply to an email
4. **archiveEmail** - Archive an email
5. **sendEmail** - Send a new email

## Testing

### To test email access:
1. Log into the website (as an admin user who has Gmail connected)
2. Open the VAPI chat widget (bottom right corner)
3. Ask: "Check my mail" or "Do I have any unread emails?"
4. Assistant should now list your unread emails

### Requirements for email to work:
- User must be logged in
- User must have Gmail connected (OAuth flow completed)
- Gmail OAuth tokens must be valid and stored in the database

## Next Steps

If email still doesn't work after this fix, check:
1. Is Gmail OAuth configured for the user?
2. Are the OAuth tokens stored correctly in the database?
3. Check webhook logs for `userId` extraction: `[---VAPI-WEBHOOK] Extracted userId: ...`
4. Verify Gmail API credentials are configured

## Files Changed
1. `src/features/vapi-chat-widget/VapiChatWidget.astro` - Added currentUser prop and metadata
2. `src/components/ui/App.astro` - Show widget to all users, pass currentUser
