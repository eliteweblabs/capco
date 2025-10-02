# 🔍 Notifications System Debug Guide

## Issue: Empty Dropdown with Badge

You're seeing a notification badge (bubble) but the dropdown is empty. Here's how to debug and fix this:

## Step 1: Check Database Migration

The most likely cause is that the notifications table doesn't exist.

### Run the Migration:

```bash
./run-notifications-migration.sh
```

This will show you the SQL script. You need to:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire SQL script
4. Execute it

## Step 2: Verify Table Exists

After running the migration, test if the table exists:

```bash
node test-notifications-debug.js
```

If you get "migrationRequired: true", the table doesn't exist yet.

## Step 3: Check Authentication

The notifications API requires authentication. Make sure you're:

1. Logged in to the application
2. The session is valid
3. The user has a valid profile

## Step 4: Test the Admin Interface

1. Go to `/admin/notifications` (you need to be an Admin)
2. Try creating a test notification
3. Check if it appears in the dropdown

## Step 5: Check Browser Console

Open browser dev tools and look for:

- Network errors in the Console tab
- Failed API calls in the Network tab
- JavaScript errors

## Common Issues & Solutions

### Issue: "migrationRequired: true"

**Solution:** Run the database migration in Supabase

### Issue: "Unauthorized" (401)

**Solution:** Make sure you're logged in and the session is valid

### Issue: "Database not configured"

**Solution:** Check your Supabase configuration in `.env`

### Issue: Badge shows but dropdown empty

**Solution:** Check browser console for JavaScript errors

## Quick Test

1. **Run migration:** Execute the SQL in Supabase
2. **Create test notification:** Use `/admin/notifications`
3. **Check dropdown:** Click the bell icon
4. **Check console:** Look for any errors

## Expected Behavior

- ✅ Badge shows number of unread notifications
- ✅ Dropdown shows notification list
- ✅ Notifications marked as viewed when dropdown opens
- ✅ Real-time updates when new notifications arrive

## Still Having Issues?

1. Check the browser console for errors
2. Verify the database migration was successful
3. Test the admin interface to create notifications
4. Check that you're properly authenticated
