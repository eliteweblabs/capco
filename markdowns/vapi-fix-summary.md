# VAPI Chat Widget Fix - Summary

## Issue Identified

The VAPI chat widget was showing "Assistant is typing..." indefinitely and making hundreds of failed network requests.

### Root Cause

The webhook endpoint (`/api/vapi/webhook`) had a critical bug where the `request` object was not being passed to the `handleToolCalls` and `handleFunctionCall` functions. This caused:

1. When the assistant tried to call tools (like `getStaffSchedule`), the webhook would fail with the error: `"request is not defined"`
2. The assistant would get stuck waiting for a response
3. The widget would show "Assistant is typing..." indefinitely
4. Failed requests would accumulate rapidly

## Changes Made

### 1. Fixed Webhook Request Parameter (CRITICAL)

**File:** `src/pages/api/vapi/webhook.ts`

- Added `request` parameter to `handleToolCalls()` and `handleFunctionCall()` functions
- Updated all calls to these functions to pass the `request` object
- Added fallback URL logic for cases where `request` might be unavailable

**Before:**
```typescript
async function handleToolCalls(
  message: any,
  calendarType: string = "calcom",
  defaultUsername?: string
)
```

**After:**
```typescript
async function handleToolCalls(
  message: any,
  calendarType: string = "calcom",
  defaultUsername?: string,
  request?: Request
)
```

### 2. Added Fallback URL Resolution

All calls to `getApiBaseUrl(request)` now have proper error handling and fallback:

```typescript
let baseUrl: string;
try {
  baseUrl = request ? getApiBaseUrl(request) : (process.env.PUBLIC_RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'https://capcofire.com');
} catch (error) {
  console.error(`[---VAPI-WEBHOOK] Error getting base URL:`, error);
  baseUrl = process.env.PUBLIC_RAILWAY_STATIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'https://capcofire.com';
}
```

This ensures the webhook can still function even if there's an issue getting the base URL.

### 3. Enhanced Widget Error Handling

**File:** `src/features/vapi-chat-widget/VapiChatWidget.astro`

Added comprehensive error handling to prevent infinite request loops:

- Request failure counter with a maximum threshold (50 failures)
- Error throttling (only log errors every 5 seconds to reduce console spam)
- Automatic widget disabling after excessive failures
- User notification when the widget is unavailable
- Script load timeout detection (30 seconds)

### 4. Created Diagnostic Test Pages

Created two test pages for debugging:

- `/tests/vapi-test` - Full diagnostic page with CDN tests and console monitoring
- `/tests/vapi-minimal` - Minimal widget configuration for isolated testing

## Testing the Fix

### 1. Test the Webhook Directly

```bash
curl -X POST "https://capcofire.com/api/vapi/webhook?calendarType=calcom" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "type": "tool-calls",
      "toolCallList": [{
        "id": "test-123",
        "function": {
          "name": "getStaffSchedule",
          "arguments": "{\"username\":\"capco\"}"
        }
      }]
    }
  }'
```

**Expected:** Should return staff schedule data instead of "request is not defined" error.

### 2. Test the Widget on the Live Site

1. Visit https://capcofire.com
2. Click the VAPI chat widget button (bottom right)
3. Send a test message
4. The assistant should respond without getting stuck on "Assistant is typing..."

### 3. Monitor Console Logs

Open browser console and look for:
- `[VAPI-WIDGET] ✅ Widget element found`
- `[VAPI-WIDGET] ✅ Request succeeded, resetting failure count`

### 4. Check Webhook Logs

After making a test call, check server logs for:
- `[---VAPI-WEBHOOK] tool-calls (calendarType: calcom)`
- `[---VAPI-WEBHOOK] Tool call: getStaffSchedule`
- `✅ [VAPI-WEBHOOK] Result: ...`

## Additional Notes

### Voice Configuration Issue (Non-blocking)

During the build, you'll see errors about the "Kylie" voice being deprecated:

```
❌ [VAPI-CAPCO] Error updating assistant: Error: Failed to update assistant: 400 
{"message":"The Kylie voice is part of a legacy voice set that is being phased out..."}
```

This is non-blocking (the build continues with `|| true`), but you should update the voice in the assistant configs to use a supported voice like "Leah" (which is currently configured for the main assistant).

### Assistant Configuration

The main assistant (ID: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`) is configured to:
1. Immediately call `getStaffSchedule` when the chat starts
2. Use Claude 3.5 Sonnet for responses
3. Use Deepgram Nova-2 for transcription
4. Use the "Leah" voice from VAPI

If the widget still gets stuck, check if:
- The Cal.com integration is working
- The webhook URL is accessible from VAPI's servers
- The tools are properly configured in the VAPI dashboard

## Deployment

The fix has been built and is ready to deploy. After deployment:

1. Test the webhook endpoint
2. Test the widget on the live site
3. Monitor for any new errors in the console or server logs

## Files Changed

1. `src/pages/api/vapi/webhook.ts` - Fixed request parameter bug
2. `src/features/vapi-chat-widget/VapiChatWidget.astro` - Added error handling
3. `src/pages/tests/vapi-test.astro` - New diagnostic page
4. `src/pages/tests/vapi-minimal.astro` - New minimal test page
5. `markdowns/vapi-widget-fix.md` - Documentation
