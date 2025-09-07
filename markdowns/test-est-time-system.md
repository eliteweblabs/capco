# Testing the EST_TIME Placeholder System

## Overview

Since the `est_time` column already exists in your database with values, let's test that the system is working correctly.

## Test Steps

### 1. Verify Database Configuration

Run this query in your Supabase SQL editor to check the current setup:

```sql
-- Check that est_time column exists and has values
SELECT
  code,
  name,
  est_time,
  LEFT(toast_admin, 50) || '...' as toast_admin_preview,
  LEFT(toast_client, 50) || '...' as toast_client_preview
FROM project_statuses
WHERE est_time IS NOT NULL
ORDER BY code;
```

### 2. Test Status Change with EST_TIME

1. **Navigate to a project page**
2. **Change the status** (if you're an admin/staff)
3. **Check the toast notification** - it should show the message with the correct `est_time` value

### 3. Test Document Submission

1. **Go to a project's Documents tab**
2. **Upload documents and click "All Documents Uploaded"**
3. **Check the success message** - it should include the `est_time` from status 20

### 4. Expected Results

**For Status 20 (Documents Submitted):**

- **Admin/Staff Message**: "Documents submitted for [Project Title] by [Client Email] - generating proposal"
- **Client Message**: "We have received your project documents and will begin preparing a proposal of services. We will notify you at [Client Email] in [EST_TIME]."

**Example with EST_TIME replacement:**

- **Before**: "We will notify you at client@example.com in {{EST_TIME}}."
- **After**: "We will notify you at client@example.com in 3-5 business days."

## Debugging

### Check API Response

If notifications aren't working, check the browser console for the API response:

```javascript
// In browser console, after a status change
// Look for the response from /api/update-status
// It should include:
{
  "success": true,
  "statusConfig": {
    "name": "Generating Proposal",
    "toast_admin": "...",
    "toast_client": "...",
    "est_time": "3-5 business days"
  }
}
```

### Check Placeholder Replacement

Verify that placeholders are being replaced correctly:

```javascript
// In browser console
// The toast message should have {{EST_TIME}} replaced with actual value
console.log("Toast message:", toastMessage);
```

## Common Issues

### 1. EST_TIME Not Replaced

**Cause**: Status config not being passed correctly
**Solution**: Check that `result.statusConfig.est_time` exists in the API response

### 2. Wrong EST_TIME Value

**Cause**: Database has incorrect values
**Solution**: Update the `est_time` values in the `project_statuses` table

### 3. No Toast Message

**Cause**: Toast system not working
**Solution**: Check that `window.showSuccess` is available

## Sample Test Data

If you need to update your database with test values:

```sql
-- Update status 20 with your example message
UPDATE project_statuses
SET
  toast_client = 'We have received your project documents and will begin preparing a proposal of services. We will notify you at {{CLIENT_EMAIL}} in {{EST_TIME}}.',
  est_time = '3-5 business days'
WHERE code = 20;

-- Update other statuses as needed
UPDATE project_statuses
SET
  toast_client = 'Your proposal is ready! We will follow up in {{EST_TIME}} if we don\'t hear from you.',
  est_time = '2-3 business days'
WHERE code = 30;
```

## Success Criteria

✅ **Database**: `est_time` column exists with values  
✅ **API**: Returns `est_time` in status config  
✅ **Components**: Pass `est_time` to toast system  
✅ **Placeholders**: `{{EST_TIME}}` gets replaced correctly  
✅ **Messages**: Toast notifications show with correct time estimates

If all these are working, your EST_TIME placeholder system is fully functional!
