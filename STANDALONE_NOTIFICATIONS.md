# Standalone Notification System

A complete notification system that works independently of the email delivery system.

## Features

- ✅ Create notifications via API
- ✅ Fetch user notifications
- ✅ Mark notifications as viewed
- ✅ Admin interface for sending custom notifications
- ✅ Notification dropdown in navbar
- ✅ Support for both user ID and email lookup
- ✅ Different notification types and priorities
- ✅ Action URLs and button text

## Database Setup

1. Run the SQL migration:

```sql
-- Run the contents of sql-queriers/create-notifications-table.sql
```

## API Endpoints

### Create Notification

**POST** `/api/notifications/create`

```json
{
  "userId": "uuid", // Optional if userEmail provided
  "userEmail": "user@example.com", // Optional if userId provided
  "title": "Notification Title",
  "message": "Notification message content",
  "type": "info", // info, success, warning, error
  "priority": "normal", // low, normal, high, urgent
  "actionUrl": "/dashboard", // Optional
  "actionText": "View Details" // Optional
}
```

### Fetch Notifications

**GET** `/api/notifications/fetch?userId=uuid&limit=50&offset=0`

### Mark as Viewed

**POST** `/api/notifications/mark-viewed`

```json
{
  "userId": "uuid",
  "notificationIds": [1, 2, 3]
}
```

## Admin Interface

Access the admin notification interface at `/admin/notifications` (Admin role required).

Features:

- Select multiple users from dropdown
- Set notification type and priority
- Add action URLs and button text
- Send notifications to multiple users at once

## Usage Examples

### Send notification to specific user by email:

```javascript
fetch("/api/notifications/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userEmail: "user@example.com",
    title: "Project Update",
    message: "Your project status has been updated",
    type: "success",
    priority: "normal",
    actionUrl: "/project/123",
    actionText: "View Project",
  }),
});
```

### Send notification to specific user by ID:

```javascript
fetch("/api/notifications/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: "user-uuid",
    title: "System Maintenance",
    message: "Scheduled maintenance will occur tonight",
    type: "warning",
    priority: "high",
  }),
});
```

## Testing

Run the test script:

```bash
node test-standalone-notifications.js
```

## Integration with Email System

The notification system can be integrated with the email system by calling the notification API from the email delivery logic:

```javascript
// In email-delivery.ts, add this after successful email sending:
if (internalMessages) {
  await fetch("/api/notifications/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userEmail: userEmail,
      title: emailSubject,
      message: emailContent,
      type: "info",
      priority: "normal",
    }),
  });
}
```

## Database Schema

The `notifications` table includes:

- `id` - Primary key
- `user_id` - References auth.users(id)
- `title` - Notification title
- `message` - Notification content
- `type` - info, success, warning, error
- `priority` - low, normal, high, urgent
- `viewed` - Boolean flag
- `created_at` - Timestamp
- `expires_at` - Optional expiration
- `metadata` - JSONB for additional data
- `action_url` - Optional action URL
- `action_text` - Optional action button text

## Security

- Row Level Security (RLS) policies ensure users can only see their own notifications
- Admin interface requires Admin role
- All API endpoints validate input data
- User lookup by email is secure and validated
