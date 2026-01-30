# VAPI Widget 403 Error - Troubleshooting Guide

**Date**: January 30, 2026
**Issue**: VAPI widget failing with 403 Forbidden on `/chat/web:1` endpoint

## Error Details

```
Failed to load resource: the server responded with a status of 403 ()
Stream error: kg: HTTP error! status: 403
  at onopen (vapi-widget.umd.js:79:2400)
  at R (vapi-widget.umd.js:79:1385)
```

## Verified Working

- ✅ Public Key is correct: `2dc62c35-17b2-4ef6-8ce0-59b39c28b4f7`
- ✅ Assistant ID is correct: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`
- ✅ Assistant is published
- ✅ Account has credits

## Root Cause

The 403 error on `/chat/web` endpoint indicates the assistant is **not configured for web/chat channel**.

## Solution

In your VAPI Dashboard (https://vapi.ai):

1. **Navigate to your assistant**
   - Go to Assistants
   - Select assistant ID: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`

2. **Enable Web/Chat Channel**
   - Look for "Channels", "Deployment", or "Integration" settings
   - Enable **"Web"** or **"Widget"** channel
   - The assistant may currently only be configured for "Phone" channel

3. **Save and Republish**
   - Save the channel configuration
   - Republish the assistant if needed

4. **Test the widget**
   - Refresh your app
   - The widget should now connect successfully

## Alternative: Create New Web-Enabled Assistant

If you can't find the channel settings:

1. Create a new assistant in VAPI
2. When creating, make sure to enable **Web/Chat** channel
3. Update `.env` with new assistant ID

## Technical Notes

- The `/chat/web:1` endpoint is specifically for web widgets
- Phone-only assistants will reject web connections with 403
- This is a VAPI server-side restriction, not a credential issue

## Enhanced Error Logging

Added better error logging to the widget to show:

- Configuration details (redacted keys)
- Specific 403 error causes
- Response body details

Check browser console for detailed error messages.
