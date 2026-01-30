# VAPI Widget Fix - Using Web SDK Instead of Widget

**Date**: January 30, 2026
**Issue**: VAPI assistant returning 403 on `/chat/web` endpoint

## Problem Analysis
The assistant is configured for **phone calls only**, not web chat. The widget embed was trying to use a phone assistant for web chat.

## Solution Implemented
Switched from the `vapi-widget` custom element to the **VAPI Web SDK** which provides more control and better error handling.

### Changes Made

1. **Removed** old widget embed approach
2. **Added** VAPI Web SDK from CDN: `@vapi-ai/web@latest`
3. **Created** custom chat button with proper initialization
4. **Added** comprehensive error handling

### New Features

- Custom styled chat button (bottom-right)
- Proper event handling (call-start, call-end, messages, errors)
- Better error messages for 403 errors
- Visual feedback during call state changes
- Console logging for debugging

### Usage

The widget will now:
1. Load the VAPI Web SDK
2. Initialize a client with your public key
3. Show a chat button in bottom-right corner
4. Start/stop calls with your assistant

### Next Steps for User

If you still get 403 errors, you need to **create a new assistant** specifically for web:

1. Go to https://vapi.ai/dashboard
2. Click **"Create Assistant"**
3. When creating, look for **"Channels"** or **"Platform"** options
4. Make sure **"Web"** is selected (not just "Phone")
5. Configure your assistant settings
6. Copy the new Assistant ID
7. Update `.env` with the new ID

Alternatively, contact VAPI support to enable web chat on your existing assistant ID: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`

### Testing

Refresh your page and check console for:
- `[VAPI] Initializing web client...`
- `[VAPI] Client created successfully`
- `[VAPI] Widget initialized successfully`

If you see those messages, the SDK loaded correctly. Click the chat button to test the connection.
