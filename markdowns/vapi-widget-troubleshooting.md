# VAPI Chat Widget Troubleshooting Guide

## Issue

The VAPI chat widget is not connecting locally or on the live site, showing multiple fetch request failures in the console.

## Root Causes Identified

### 1. **Script Loading Timing Issue**

The widget script from unpkg.com CDN may be loading before the widget element is fully initialized, or the CDN request is failing.

### 2. **Environment Variables**

Environment variables are correctly set in `.env`:

- `PUBLIC_VAPI_KEY`: `77cb0a47-2427-44ac-996d-e6ed2ca03bbf`
- `PUBLIC_VAPI_ASSISTANT_ID`: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`

### 3. **Widget Visibility Condition**

The widget only appears for non-authenticated users (see `App.astro` line 665):

```astro
{
  !currentUser && !isBackend && !isAuthPageResult && !isContactPageResult && (
    <VapiChatWidget basic={true} />
  )
}
```

## Diagnostic Tool Created

Created `/src/pages/tests/vapi-debug.astro` - A comprehensive debug page that:

- ✅ Checks environment variables
- ✅ Tests CDN connectivity
- ✅ Tests VAPI API connectivity
- ✅ Monitors widget loading status
- ✅ Intercepts and logs all VAPI fetch requests
- ✅ Shows real-time console logs

**To use:** Navigate to `http://localhost:4321/tests/vapi-debug` (or your live domain)

## Recommended Fixes

### Fix 1: Improve Widget Loading Strategy

Update `/src/features/vapi-chat-widget/VapiChatWidget.astro` to use a more robust loading strategy:

**Option A: Load script before widget element**

```astro
<!-- Load script first -->
<script
  src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
  defer
  type="text/javascript"></script>

<!-- Then place widget element -->
<vapi-widget id="vapi-widget-basic" ...></vapi-widget>
```

**Option B: Use SRI (Subresource Integrity) for security**

```astro
<script
  src="https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js"
  integrity="..."
  crossorigin="anonymous"
  defer></script>
```

### Fix 2: Add Fallback CDN or Self-Host

Download the widget script and serve it locally:

```bash
# Download the script
curl -o public/js/vapi-widget.umd.js https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js

# Then use local path
<script src="/js/vapi-widget.umd.js" defer type="text/javascript"></script>
```

### Fix 3: Verify VAPI Account Status

Check your VAPI account at https://dashboard.vapi.ai to ensure:

- ✅ Account is active
- ✅ Assistant ID `3ae002d5-fe9c-4870-8034-4c66a9b43b51` exists
- ✅ Public key `77cb0a47-2427-44ac-996d-e6ed2ca03bbf` is valid
- ✅ No usage limits exceeded
- ✅ Assistant is published/deployed

### Fix 4: Update Error Handling

The current widget has extensive error monitoring that might be too aggressive. Consider:

1. **Increase failure threshold** - Currently set to 50 failures (line 76 in VapiChatWidget.astro)
2. **Add retry logic** - Retry failed requests before disabling widget
3. **Show clearer error messages** - Tell users what went wrong

### Fix 5: Check Network/Firewall Issues

Test if unpkg.com is accessible:

```bash
curl -I https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js
```

If blocked, consider:

- Firewall rules
- Corporate proxy
- Ad blockers
- Content Security Policy (CSP) headers

### Fix 6: Update CSP Headers (if applicable)

If you have Content Security Policy headers, ensure they allow:

```
script-src 'self' https://unpkg.com;
connect-src 'self' https://api.vapi.ai wss://api.vapi.ai;
```

## Testing Steps

1. **Test locally as non-authenticated user**:
   - Log out or use incognito mode
   - Navigate to homepage
   - Check if widget appears in bottom-right
   - Open browser console for errors

2. **Use the debug page**:
   - Go to `/tests/vapi-debug`
   - Click "Test CDN Connection"
   - Click "Test VAPI API"
   - Check all status indicators

3. **Test on live site**:
   - Deploy changes
   - Test from different networks
   - Test from different devices

## Current Widget Configuration

Located in `/src/features/vapi-chat-widget/VapiChatWidget.astro`:

```astro
<vapi-widget
  id="vapi-widget-basic"
  public-key={publicKey}
  assistant-id={assistantId}
  mode="chat"
  {theme}
  position="bottom-right"
  title="Live"
  chat-first-message="Hi, this is Leah with {company}..."></vapi-widget>
```

## Next Steps

1. ✅ Run the debug page to identify the exact failure point
2. ⏳ Check VAPI dashboard for account status
3. ⏳ Test CDN connectivity
4. ⏳ Implement one of the recommended fixes
5. ⏳ Re-test locally and on live site

## Alternative Solutions

If VAPI continues to have issues, consider:

1. **Use Vapi Web SDK directly** instead of the widget
2. **Build custom chat UI** with Vapi API integration
3. **Switch to alternative provider** (if needed)

## Files Modified

- `/src/pages/tests/vapi-debug.astro` - Created diagnostic tool
- `/markdowns/vapi-widget-troubleshooting.md` - This documentation

## Related Files

- `/src/features/vapi-chat-widget/VapiChatWidget.astro` - Main widget component
- `/src/components/ui/App.astro` - Widget integration (line 666)
- `/src/pages/tests/vapi-test.astro` - Existing test page
- `/src/pages/tests/vapi-minimal.astro` - Minimal test page
