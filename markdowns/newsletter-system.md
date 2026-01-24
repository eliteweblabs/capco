# Newsletter Management System

## Overview
A comprehensive newsletter management system for admin users to create, manage, and send newsletters via email and SMS.

## Location
- **Admin Page**: `/admin/newsletters`
- **Position**: Above `tests` in the admin navigation menu

## Features

### 1. Newsletter Creation
- **Title**: Internal admin reference name
- **Subject**: Email subject line shown to recipients
- **Content**: HTML-supported content (converted to plain text for SMS)
- **Draft Mode**: Must be turned off before sending
- **Active Status**: Newsletter must be active to send

### 2. Recipient Targeting

Four pre-defined groups:
- **All Users**: Send to everyone in the system
- **Staff Only**: Send only to users with Staff role
- **Clients Only**: Send only to users with Client role
- **Admins Only**: Send only to users with Admin role

Custom Selection:
- Search users by name, email, or company
- Multi-select with checkboxes
- Shows selected recipient count
- Supports 1 to many custom recipients

### 3. Delivery Methods

**Email** (default enabled):
- Sends HTML email via Resend API
- Uses company branding (FROM_EMAIL, FROM_NAME)
- Full HTML support in content

**SMS** (optional):
- Sends via SMS gateway (email-to-SMS)
- Requires user to have `phone` and `smsCarrier` fields populated
- Content automatically stripped of HTML and truncated to 250 chars
- Subject truncated to 50 chars for SMS

### 4. Newsletter Management

**List View**:
- Shows all newsletters with status indicators
- Draft newsletters highlighted in orange
- Active newsletters highlighted in green
- Shows creation date, last sent date, and send count

**Actions**:
- **Edit**: Modify newsletter details
- **Send Now**: Only available for non-draft, active newsletters
- **Delete**: Remove newsletter permanently

## Database Schema

```sql
CREATE TABLE newsletters (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  recipientType TEXT NOT NULL DEFAULT 'all',
  customRecipients TEXT[],
  isActive BOOLEAN DEFAULT true,
  isDraft BOOLEAN DEFAULT true,
  deliverViaEmail BOOLEAN DEFAULT true,
  deliverViaSms BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lastSentAt TIMESTAMP WITH TIME ZONE,
  sentCount INTEGER DEFAULT 0
);
```

## API Endpoints

### `/api/newsletters/upsert`
- **Method**: POST
- **Purpose**: Create or update newsletter
- **Auth**: Admin only
- **Body**: Newsletter object with all fields

### `/api/newsletters/delete`
- **Method**: POST
- **Purpose**: Delete newsletter
- **Auth**: Admin only
- **Body**: `{ id: number }`

### `/api/newsletters/send`
- **Method**: POST
- **Purpose**: Send newsletter to recipients
- **Auth**: Admin only
- **Body**: `{ id: number }`
- **Validation**: Newsletter must be active and not draft

## Integration with Existing APIs

### User Query API
Uses `/api/users/get` to fetch recipients:
- Supports role filtering
- Supports search by name, email, company
- Pagination support for large user lists

### Email/SMS Delivery
Uses existing Resend API infrastructure:
- Email API key from `EMAIL_API_KEY` env var
- From address from `FROM_EMAIL` env var
- From name from `FROM_NAME` env var

## User Experience

### Creating a Newsletter
1. Fill in title (admin reference)
2. Write subject line (what users see)
3. Write content (HTML supported)
4. Choose recipient type (all/staff/client/admin/custom)
5. If custom, search and select specific users
6. Toggle email/SMS delivery options
7. Keep as draft for testing or turn off draft to allow sending
8. Save newsletter

### Sending a Newsletter
1. Newsletter must be:
   - Active (toggle on)
   - Not in draft mode (toggle off)
2. Click "Send Now" button
3. Confirm send action
4. System sends to all targeted recipients
5. Updates `lastSentAt` and `sentCount` fields

### Search and Selection (Custom Recipients)
- Type in search box to filter users
- See results with name, company, and email
- Click checkbox to select/deselect
- Selected count updates in real-time
- Selected users persist when editing

## Safety Features

1. **Draft Mode**: Prevents accidental sends
2. **Confirmation Dialog**: Requires confirmation before sending
3. **Active Status**: Additional safety toggle
4. **Send Statistics**: Tracks success/failure counts
5. **Error Handling**: Continues sending even if some fail, reports all errors

## Technical Notes

### SMS Delivery
- Requires user profile fields: `phone` and `smsCarrier`
- SMS gateway format: `{phone}{smsCarrier}`
- Example: `1234567890@vtext.com`
- Content automatically sanitized for SMS (no HTML, length limits)

### HTML Content
- Full HTML supported in email body
- Automatically converted to plain text for SMS
- Use inline CSS for email styling
- Markdown can be converted to HTML before saving

### Performance
- Sends sequentially (not batched) to track individual success/failure
- For large recipient lists, consider adding job queue in future
- Current implementation suitable for <1000 recipients

## Future Enhancements

Potential improvements:
- **Scheduling**: Set future send date/time
- **Templates**: Reusable newsletter templates
- **Analytics**: Track open rates, click rates
- **A/B Testing**: Test different subject lines/content
- **Recurring**: Auto-send on schedule (daily/weekly/monthly)
- **Attachments**: Support file attachments
- **Segments**: More advanced recipient filtering
- **Batch Processing**: Queue system for large sends

## Testing Checklist

- [ ] Create newsletter as draft
- [ ] Edit newsletter
- [ ] Toggle recipient types (all/staff/client/admin)
- [ ] Search and select custom recipients
- [ ] Verify draft newsletters cannot be sent
- [ ] Send newsletter to test email
- [ ] Send newsletter to test SMS
- [ ] Verify send count increments
- [ ] Delete newsletter
- [ ] Test with inactive newsletter
- [ ] Test with large recipient list (100+)
- [ ] Verify HTML renders correctly in email
- [ ] Verify SMS content is plain text and truncated
