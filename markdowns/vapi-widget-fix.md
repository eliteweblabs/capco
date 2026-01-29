# VAPI Widget Issue Fix

## Problem
The VAPI chat widget is not working properly - showing "Assistant is typing..." indefinitely and making hundreds of failed network requests.

## Root Causes Identified

### 1. Potential API Rate Limiting
- The screenshot shows 294 failed requests
- This suggests the widget is in a request loop, possibly due to:
  - Invalid API responses triggering retries
  - Webhook configuration issues
  - Network connectivity problems

### 2. Widget Configuration Issues
Based on the current setup in `VapiChatWidget.astro`:

```astro
<vapi-widget
  id="vapi-widget-basic"
  public-key={publicKey}
  assistant-id={assistantId}
  mode="chat"
  ...
/>
```

## Solutions

### Immediate Fix: Add Error Handling and Request Limiting

Update the `VapiChatWidget.astro` to add proper error handling:

```astro
<!-- Add after the vapi-widget element -->
<script>
  // Prevent infinite request loops
  let requestFailureCount = 0;
  const MAX_FAILURES = 10;
  let widgetDisabled = false;

  // Override fetch to monitor VAPI requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    
    if (widgetDisabled) {
      console.warn('[VAPI] Widget disabled due to excessive failures');
      return Promise.reject(new Error('Widget disabled'));
    }
    
    try {
      const response = await originalFetch.apply(this, args);
      
      // Reset counter on successful request
      if (response.ok && typeof url === 'string' && url.includes('vapi')) {
        requestFailureCount = 0;
      }
      
      return response;
    } catch (error) {
      // Track failures
      if (typeof url === 'string' && url.includes('vapi')) {
        requestFailureCount++;
        console.error(`[VAPI] Request failed (${requestFailureCount}/${MAX_FAILURES}):`, error);
        
        if (requestFailureCount >= MAX_FAILURES) {
          widgetDisabled = true;
          console.error('[VAPI] Too many failures, disabling widget');
          
          // Hide the widget
          const widget = document.getElementById('vapi-widget-basic');
          if (widget) {
            widget.style.display = 'none';
          }
          
          // Show error message
          if (window.showNotice) {
            window.showNotice('error', 'Chat Unavailable', 'The chat service is temporarily unavailable. Please try again later.', 5000);
          }
        }
      }
      
      throw error;
    }
  };
</script>
```

### Check Webhook Configuration

The assistant's webhook is configured to: `https://capcofire.com/api/vapi/webhook?calendarType=calcom`

Verify the webhook is responding correctly:

```bash
curl -X POST https://capcofire.com/api/vapi/webhook?calendarType=calcom \
  -H "Content-Type: application/json" \
  -d '{"type":"function-call","functionCall":{"name":"test"}}' \
  -v
```

### Check Assistant Configuration

The assistant is configured correctly (verified via API):
- ✅ Assistant ID: `3ae002d5-fe9c-4870-8034-4c66a9b43b51`
- ✅ Public Key: `77cb0a47-2427-44ac-996d-e6ed2ca03bbf`
- ✅ Voice: Leah (Vapi provider)
- ✅ Model: Claude 3.5 Sonnet

### Potential Issues to Check

1. **Webhook Timeout**: The webhook has a 20-second timeout. If the webhook is slow or hanging, it could cause the widget to retry indefinitely.

2. **Tool Configuration**: The assistant has 2 tools configured:
   - `0b17d3bc-a697-432b-8386-7ed1235fd111`
   - `5b8ac059-9bbe-4a27-985d-70df87f9490d`
   
   If these tools are failing, it could cause the loop.

3. **CORS Issues**: The widget might be blocked by CORS policies.

4. **Rate Limiting**: VAPI may be rate limiting the requests.

## Testing Steps

1. Visit the test page: `/tests/vapi-test`
2. Open browser console
3. Check for specific error messages
4. Monitor network tab for failed requests
5. Check if webhook is responding

## Next Steps

1. ✅ Created diagnostic test page
2. 🔄 Add error handling to widget (need to implement)
3. 🔄 Test webhook endpoint
4. 🔄 Check tool configurations
5. 🔄 Monitor for rate limiting

## Alternative: Simpler Widget Configuration

Try a minimal configuration first:

```astro
<vapi-widget
  public-key={publicKey}
  assistant-id={assistantId}
/>
<script
  src="https://unpkg.com/@vapi-ai/web@latest/dist/vapi.js"
  async
/>
```

This removes all customization and uses default settings to isolate configuration issues.
