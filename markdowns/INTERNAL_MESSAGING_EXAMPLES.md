# Internal Messaging System - Usage Examples

This document shows how to use the simple messaging toggle that allows you to choose between email and internal notifications.

## Overview

The system now supports one simple parameter:

- `internalMessages`: Simple toggle - true = internal notifications, false = email

## Usage Examples

### 1. Send Emails to Everyone (Default Behavior)

```javascript
const emailData = {
  usersToNotify: ["admin@example.com", "client@example.com"],
  emailType: "proposal_submitted",
  emailSubject: "New Proposal Submitted",
  emailContent: "A new proposal has been submitted.",
  // No internal messaging flags = sends emails to everyone
};
```

### 2. Send Internal Messages to Everyone

```javascript
const emailData = {
  usersToNotify: ["admin@example.com", "client@example.com"],
  emailType: "proposal_submitted",
  emailSubject: "New Proposal Submitted",
  emailContent: "A new proposal has been submitted.",
  internalMessages: true, // Sends internal notifications to everyone
};
```

## API Response

The API will return information about what was sent:

```json
{
  "success": true,
  "sentEmails": ["admin@example.com", "client@example.com"],
  "failedEmails": [],
  "totalSent": 2,
  "totalFailed": 0,
  "message": "Notifications sent successfully"
}
```

## Console Logging

The system provides detailed logging:

```
📧 [EMAIL-DELIVERY] User: admin@example.com, Role: Admin, SendEmail: false, SendInternal: true
✅ [NOTIFICATIONS] Internal message sent to admin@example.com
📧 [EMAIL-DELIVERY] User: client@example.com, Role: Client, SendEmail: true, SendInternal: false
📧 [EMAIL-DELIVERY] Email sent successfully to client@example.com
```

## Simple Logic

The system works with a simple boolean:

- `internalMessages: true` → Send internal notifications to all users
- `internalMessages: false` (or not set) → Send emails to all users

## Error Handling

- If internal messaging fails, it's logged as a failed delivery
- If email sending fails, it's logged as a failed delivery
- All failures are tracked in the response

## Integration Examples

### Frontend JavaScript

```javascript
// Send internal messages to everyone
const response = await fetch("/api/email-delivery", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    usersToNotify: ["admin@example.com", "client@example.com"],
    emailType: "system_alert",
    emailSubject: "System Maintenance",
    emailContent: "System will be down for maintenance.",
    internalMessages: true,
  }),
});
```

### Server-side Integration

```typescript
// In your server-side code
const emailPayload = {
  usersToNotify: ["admin@example.com", "client@example.com"],
  emailType: "proposal_approved",
  emailSubject: "Proposal Approved",
  emailContent: "Your proposal has been approved!",
  internalMessages: true, // Everyone gets internal messages
};

const response = await fetch("/api/email-delivery", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(emailPayload),
});
```

## Benefits

1. **Simple Toggle**: Easy to switch between email and internal notifications
2. **Reduced Email Overload**: Use internal messages for frequent updates
3. **Better User Experience**: Users get instant notifications without email spam
4. **Backward Compatibility**: Existing code continues to work (sends emails by default)
5. **Clean Implementation**: Simple boolean flag controls the entire system
