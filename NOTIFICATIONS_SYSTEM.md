# Internal Notifications System

This document describes the internal notifications system that provides real-time notifications to users within the application.

## Overview

The notifications system automatically creates internal notifications when emails are sent to users, providing a centralized way to track important updates and communications. Users can view these notifications in a dropdown in the navigation bar.

## Features

- **Automatic Notification Creation**: Notifications are automatically created when emails are sent
- **Real-time Updates**: Notifications are polled every 30 seconds for updates
- **Auto-mark as Viewed**: Notifications are marked as viewed when displayed in the dropdown
- **Priority System**: Notifications have different priority levels (low, normal, high, urgent)
- **Type System**: Different notification types (info, success, warning, error)
- **Action Links**: Notifications can include action buttons with custom URLs
- **Expiration**: Notifications can have optional expiration dates
- **Bulk Operations**: Mark multiple notifications as read or delete them

## Database Schema

The system uses a `notifications` table with the following structure:

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'normal',
    viewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    metadata JSONB DEFAULT '{}',
    action_url VARCHAR(500) NULL,
    action_text VARCHAR(100) NULL
);
```

## Setup Instructions

### 1. Database Migration

Run the SQL migration script to create the notifications table:

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to your Supabase dashboard
# 2. Navigate to SQL Editor
# 3. Copy and paste the contents of sql-queriers/create-notifications-table.sql
# 4. Execute the script

# Option 2: Via psql (if you have database access)
psql -h your-db-host -U your-username -d your-database -f sql-queriers/create-notifications-table.sql
```

### 2. Verify Setup

You can verify the setup by calling the setup API:

```bash
curl -X POST http://localhost:4321/api/setup-notifications \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie"
```

## API Endpoints

### GET /api/notifications

Fetch user notifications.

**Query Parameters:**
- `limit` (optional): Number of notifications to fetch (default: 20)
- `offset` (optional): Number of notifications to skip (default: 0)
- `unread_only` (optional): Only fetch unread notifications (default: false)

**Response:**
```json
{
  "success": true,
  "notifications": [...],
  "unreadCount": 5,
  "limit": 20,
  "offset": 0
}
```

### POST /api/notifications

Mark notifications as viewed.

**Request Body:**
```json
{
  "notificationIds": [1, 2, 3]
}
```

### DELETE /api/notifications

Delete a notification.

**Request Body:**
```json
{
  "notificationId": 123
}
```

## Integration with Email System

The notifications system is automatically integrated with the email delivery system. When an email is sent via `/api/email-delivery`, a corresponding notification is created for the recipient.

### Email Types and Notification Mapping

| Email Type | Notification Type | Priority | Title | Message |
|-----------|------------------|----------|-------|---------|
| `proposal_submitted` | success | high | "New Proposal Submitted" | "A new proposal has been submitted for your project." |
| `proposal_approved` | success | high | "Proposal Approved" | "Your proposal has been approved and is ready for next steps." |
| `proposal_rejected` | warning | high | "Proposal Requires Changes" | "Your proposal needs some adjustments before it can be approved." |
| `payment_received` | success | normal | "Payment Received" | "We have received your payment. Thank you!" |
| `project_status_change` | info | normal | "Project Status Updated" | "Your project status has been updated." |
| `document_uploaded` | info | normal | "New Document Uploaded" | "A new document has been uploaded to your project." |
| `system_alert` | warning | high | "System Alert" | [Uses email content] |

## Navigation Bar Integration

The notification dropdown is automatically added to the navigation bar for authenticated users. It includes:

- **Notification Bell**: Shows unread count badge
- **Dropdown Menu**: Displays recent notifications
- **Auto-mark as Viewed**: Notifications are marked as viewed when displayed
- **Scroll to Mark Viewed**: Notifications are marked as viewed when scrolled into view
- **Mark All Read**: Button to mark all notifications as read
- **Delete Notifications**: Individual delete buttons for each notification

## Usage Examples

### Creating Notifications Programmatically

```typescript
import { createNotification } from '../pages/api/email-delivery';

// Create a simple notification
const notification = await createNotification({
  userId: 'user-uuid',
  title: 'Welcome!',
  message: 'Welcome to the platform!',
  type: 'success',
  priority: 'normal'
});

// Create a notification with action
const actionNotification = await createNotification({
  userId: 'user-uuid',
  title: 'New Project Assigned',
  message: 'You have been assigned to a new project.',
  type: 'info',
  priority: 'high',
  actionUrl: '/project/123',
  actionText: 'View Project'
});
```

### Creating Bulk Notifications

```typescript
import { createBulkNotifications } from '../pages/api/email-delivery';

const notifications = [
  {
    userId: 'user1-uuid',
    title: 'Project Update',
    message: 'Your project has been updated.',
    type: 'info'
  },
  {
    userId: 'user2-uuid',
    title: 'Project Update',
    message: 'Your project has been updated.',
    type: 'info'
  }
];

const result = await createBulkNotifications(notifications);
console.log(`Created ${result.created} notifications`);
```

## Security

- **Row Level Security (RLS)**: Users can only see their own notifications
- **Admin Access**: Only admins can create notifications for other users
- **Authentication Required**: All API endpoints require authentication
- **Data Validation**: All input is validated and sanitized

## Performance Considerations

- **Polling Interval**: Notifications are polled every 30 seconds
- **Database Indexes**: Optimized indexes for fast queries
- **Pagination**: Notifications are paginated to limit data transfer
- **Auto-cleanup**: Expired notifications are automatically cleaned up

## Troubleshooting

### Notifications Not Appearing

1. Check if the notifications table exists
2. Verify RLS policies are correctly set up
3. Check browser console for JavaScript errors
4. Verify user authentication

### Database Connection Issues

1. Ensure Supabase is properly configured
2. Check environment variables
3. Verify database permissions

### Email Integration Issues

1. Check email delivery logs
2. Verify notification creation in email-delivery.ts
3. Check user ID mapping from email to user

## Future Enhancements

- **Real-time Updates**: WebSocket integration for instant notifications
- **Email Preferences**: User preferences for notification types
- **Notification Templates**: Customizable notification templates
- **Mobile Push Notifications**: Push notifications for mobile devices
- **Notification Analytics**: Track notification engagement
- **Bulk Actions**: Select and manage multiple notifications
- **Notification Categories**: Organize notifications by category
- **Rich Content**: Support for images and rich text in notifications
