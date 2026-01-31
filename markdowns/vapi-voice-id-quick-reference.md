# VAPI Voice ID / Authentication - Quick Reference

## TL;DR

**VAPI.ai does NOT have voice biometrics.** We use session-based authentication instead.

## How It Works

1. **User logs in** → Supabase auth
2. **User visits `/voice-assistant-vapi`** → Page checks auth
3. **User starts voice call** → Metadata sent to VAPI
4. **VAPI calls webhook** → Webhook receives user metadata
5. **Webhook calls internal APIs** → User context preserved

## User Metadata Structure

```javascript
{
  userId: "uuid-here",
  userEmail: "user@example.com",
  userName: "John Doe",
  userRole: "Admin" | "Client"
}
```

## Code Snippets

### Client-Side (Starting VAPI Call)

```javascript
// src/pages/voice-assistant-vapi.astro
await vapi.start(assistantId, {
  metadata: {
    userId: currentUser?.id,
    userEmail: currentUser?.email,
    userName: currentUser?.profile?.name,
    userRole: currentUserRole,
  },
});
```

### Server-Side (Webhook)

```typescript
// src/pages/api/vapi/webhook.ts

// Extract metadata
const callMetadata = body.message?.call?.metadata || body.call?.metadata;
const userId = callMetadata?.userId;

// Pass to internal API
await fetch(`/api/projects/upsert`, {
  method: "POST",
  headers: {
    "X-User-Id": userId,
    "X-User-Email": callMetadata.userEmail,
  },
  body: JSON.stringify({ ...data, authorId: userId }),
});
```

## Security Checklist

- ✅ Page requires authentication (checkAuth)
- ✅ User metadata passed to VAPI
- ✅ Webhook extracts user context
- ✅ Internal APIs receive user info
- ⚠️ Webhook signature validation (recommended)
- ⚠️ Rate limiting (recommended)

## Testing

```bash
# 1. Check metadata is sent
# Open browser console → Network tab → Filter "vapi"
# Start call → Look for metadata in request

# 2. Check webhook receives it
# Check server logs for:
[---VAPI-WEBHOOK] ... (userId: xxx)

# 3. Check projects have authorId
SELECT * FROM projects WHERE author_id IS NOT NULL ORDER BY created_at DESC LIMIT 5;
```

## Common Issues

### Issue: Projects created without authorId
**Solution:** Check that metadata is being passed when starting call

### Issue: Webhook doesn't receive metadata
**Solution:** Verify VAPI SDK version and metadata structure

### Issue: User can't access voice assistant page
**Solution:** Check Supabase authentication status

## Want Real Voice Biometrics?

Use third-party service:
- AWS Connect Voice ID
- Azure Speaker Recognition
- Pindrop
- Nuance

Cost: ~$0.01-$0.10 per verification

**Not recommended unless:**
- Regulatory requirement
- High-value financial transactions
- Defense-in-depth security needed

## Files to Check

- `/src/pages/voice-assistant-vapi.astro` - Frontend
- `/src/pages/api/vapi/webhook.ts` - Backend webhook
- `/src/lib/auth.ts` - Authentication helper

## Documentation

- Full setup: `markdowns/vapi-authentication-setup.md`
- Implementation details: `markdowns/vapi-voice-id-authentication-implementation.md`
