# Centralized Toast Notification System

## Overview

The toast notification system has been centralized to pull all messaging from the database, making it consistent and maintainable across the application. This system uses placeholder replacement to create dynamic, contextual messages based on user roles and project data.

## Database Schema

### New Columns Added to `project_statuses` Table

- `toast_admin` (TEXT): Toast message shown to admin users when this status is reached
- `toast_client` (TEXT): Toast message shown to client users when this status is reached

### Placeholder Support

The system supports the following placeholders in toast messages:

- `{{PROJECT_TITLE}}` - The project title or address
- `{{CLIENT_EMAIL}}` - The client's email address
- `{{COMPANY_NAME}}` - The client's name (first + last or company name)
- `{{PROJECT_ADDRESS}}` - The project address
- `{{STATUS_NAME}}` - The status name
- `{{EST_TIME}}` - The estimated time from the status's `est_time` column

## Implementation

### 1. Database Setup

Run the `add-toast-messages.sql` script to:

- Add the new toast message columns
- Populate default messages for all status codes
- Configure role-specific messaging

### 2. Utility Functions

**File**: `src/lib/toast-message-utils.ts`

Key functions:

- `replaceToastPlaceholders()` - Replaces placeholders with actual data
- `getToastMessage()` - Gets appropriate message based on user role
- `prepareToastData()` - Prepares data for placeholder replacement

### 3. API Integration

**File**: `src/pages/api/update-status.ts`

The API now returns status configuration including toast messages:

```json
{
  "success": true,
  "project": {...},
  "statusConfig": {
    "name": "Status Name",
    "toast_admin": "Admin message with {{PROJECT_TITLE}}",
    "toast_client": "Client message with {{CLIENT_EMAIL}}"
  }
}
```

### 4. Component Integration

#### ProjectStatusDropdown Component

**File**: `src/components/project/ProjectStatusDropdown.astro`

- Accepts new props: `userRole`, `projectTitle`, `clientEmail`
- Uses data attributes to pass information to client-side JavaScript
- Shows role-appropriate toast messages on status changes

#### PDFUpload Component

**File**: `src/components/project/PDFUpload.astro`

- Uses centralized toast system for document submission success
- Falls back to legacy messages if no status config is available
- Supports placeholder replacement for dynamic messaging

## Usage Examples

### Database Message Examples

```sql
-- Status 20 (Generating Proposal) - Documents submitted
-- Using EST_TIME placeholder for dynamic time estimates
UPDATE project_statuses
SET
  toast_admin = 'Documents submitted for {{PROJECT_TITLE}} by {{CLIENT_EMAIL}} - generating proposal',
  toast_client = 'We have received your project documents and will begin preparing a proposal of services. We will notify you at {{CLIENT_EMAIL}} in {{EST_TIME}}.',
  est_time = '3-5 business days'
WHERE code = 20;
```

### Component Usage

```astro
<ProjectStatusDropdown
  projectId={project.id}
  currentStatus={project.status}
  statusLabel={statusLabels[project.status]}
  userRole={role}
  projectTitle={project.title}
  clientEmail={projectAuthorProfile.email}
/>
```

### Client-Side JavaScript

```javascript
// Get toast message from API response
if (result.statusConfig) {
  const userRole = dropdownButton.getAttribute("data-user-role");
  const projectTitle = dropdownButton.getAttribute("data-project-title");
  const clientEmail = dropdownButton.getAttribute("data-client-email");

  // Determine which message to show
  let toastMessage = "";
  if (userRole === "Admin" || userRole === "Staff") {
    toastMessage = result.statusConfig.toast_admin || "";
  } else {
    toastMessage = result.statusConfig.toast_client || "";
  }

  // Replace placeholders
  toastMessage = toastMessage
    .replace(/{{PROJECT_TITLE}}/g, projectTitle)
    .replace(/{{CLIENT_EMAIL}}/g, clientEmail);

  // Show notification using centralized system
  if (window.showSuccess) {
    window.showSuccess("Status Updated", toastMessage, 5000);
  } else {
    console.log(`🔔 [Status Updated] ${toastMessage}`);
  }
}
```

## Benefits

1. **Centralized Management**: All toast messages are stored in the database
2. **Role-Based Messaging**: Different messages for admins vs clients
3. **Dynamic Content**: Placeholder replacement for contextual information
4. **Consistency**: Uniform messaging across all status changes
5. **Maintainability**: Easy to update messages without code changes
6. **Fallback Support**: Graceful degradation if database config is missing

## Migration Steps

1. Run `add-toast-messages.sql` in your Supabase SQL editor
2. Update components to pass necessary props
3. Test toast notifications for different user roles
4. Customize messages in the database as needed

## Customization

To customize toast messages:

1. **Add new placeholders**: Extend the `replaceToastPlaceholders()` function
2. **Modify existing messages**: Update the database directly
3. **Add new status codes**: Include toast messages when adding new statuses
4. **Role-specific logic**: Add additional role checks in `getToastMessage()`

## Troubleshooting

### Common Issues

1. **No toast messages showing**: Check if `statusConfig` is returned from API
2. **Placeholders not replaced**: Verify data attributes are set correctly
3. **Wrong role message**: Ensure `userRole` prop is passed correctly
4. **Database errors**: Check if toast columns exist in `project_statuses` table

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API response includes `statusConfig`
3. Confirm data attributes are set on components
4. Test placeholder replacement manually
