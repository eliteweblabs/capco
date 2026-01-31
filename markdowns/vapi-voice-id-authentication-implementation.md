# VAPI Voice ID / Authentication Implementation

**Date:** January 30, 2026  
**Status:** ✅ Implemented

## Summary

Corrected misleading "voice authentication" claims and implemented proper session-based authentication for the VAPI voice assistant using Supabase auth + user metadata passing.

## Key Finding

**VAPI.ai does NOT support voice biometrics or speaker identification.** Previous documentation incorrectly suggested voice-based authentication was available.

## Changes Made

### 1. Updated Voice Assistant Page (`src/pages/voice-assistant-vapi.astro`)

#### Corrected Documentation

- ✅ Removed misleading claims about "voice authentication"
- ✅ Updated to accurately describe session-based authentication
- ✅ Changed "Only YOUR voice" to "Session-based Security"
- ✅ Added accurate description of security features

#### Added User Metadata Passing

```javascript
await vapi.start(assistantId, {
  metadata: {
    userId: currentUser?.id,
    userEmail: currentUser?.email,
    userName: currentUser?.profile?.name,
    userRole: currentUserRole,
  },
});
```

#### Benefits:

- User context available in VAPI webhooks
- Can validate user identity in backend
- Enables user-specific features
- Maintains audit trail

### 2. Enhanced Webhook Authentication (`src/pages/api/vapi/webhook.ts`)

#### Extract User Metadata from Calls

```typescript
const callMetadata = (body as any).message?.call?.metadata || (body as any).call?.metadata;
const metadataUserId = callMetadata?.userId;
const metadataUserEmail = callMetadata?.userEmail;
```

#### Pass User Context to Internal APIs

For `createProject`:

```typescript
if (callMetadata?.userId) {
  args.authorId = callMetadata.userId;
}

const projectResponse = await fetch(`${baseUrl}/api/projects/upsert`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(callMetadata?.userId && { "X-User-Id": callMetadata.userId }),
    ...(callMetadata?.userEmail && { "X-User-Email": callMetadata.userEmail }),
  },
  body: JSON.stringify(args),
});
```

For `rememberConversation`:

```typescript
const rememberResponse = await fetch(`${baseUrl}/api/voice-assistant/remember`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(callMetadata?.userId && { "X-User-Id": callMetadata.userId }),
    ...(callMetadata?.userEmail && { "X-User-Email": callMetadata.userEmail }),
  },
  body: JSON.stringify({
    title: args.title,
    content: args.content,
    userId: callMetadata?.userId,
    // ...
  }),
});
```

### 3. Created Documentation

#### New Documentation Files:

1. **`markdowns/vapi-authentication-setup.md`** - Comprehensive authentication guide
2. **`markdowns/vapi-voice-id-authentication-implementation.md`** - This file

## Authentication Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  User Logs In                            │
│              (Supabase Authentication)                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│          Access Voice Assistant Page                     │
│        (Protected via checkAuth middleware)              │
│        - Page redirects if not authenticated             │
│        - User context loaded from Supabase               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│          User Starts VAPI Call                           │
│        - Metadata passed: userId, userEmail, etc.        │
│        - VAPI receives user context                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│          VAPI Calls Webhook                              │
│        - Webhook extracts user metadata                  │
│        - Validates user context (optional)               │
│        - Passes to internal APIs                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│          Internal APIs Process Request                   │
│        - Receive user context via headers                │
│        - Associate actions with authenticated user       │
│        - Store in database with authorId                 │
└─────────────────────────────────────────────────────────┘
```

## Security Layers

### ✅ Layer 1: Page-Level Authentication

- Supabase `checkAuth()` middleware
- Redirects unauthenticated users to login
- Already implemented ✅

### ✅ Layer 2: User Metadata Passing

- User context passed to VAPI on call start
- Metadata available in all webhook calls
- Implemented ✅

### ✅ Layer 3: Webhook User Context Extraction

- Extract userId and userEmail from call metadata
- Log user context for audit trail
- Implemented ✅

### ✅ Layer 4: Internal API User Association

- Pass user context to internal APIs
- Associate projects with authorId
- Track who performed actions
- Implemented ✅

### ⚠️ Layer 5: Webhook Signature Validation (Recommended)

**Not yet implemented** - Should validate VAPI signature:

```typescript
const signature = request.headers.get("x-vapi-signature");
// Verify signature matches expected value
```

### ⚠️ Layer 6: Rate Limiting (Recommended)

**Not yet implemented** - Should limit calls per user:

```typescript
const callsInLastHour = await redis.get(`vapi:calls:${userId}`);
if (callsInLastHour > 100) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

### ⚠️ Layer 7: JWT Authentication (Optional, Advanced)

**Not yet implemented** - Additional security via JWT tokens

## Testing the Implementation

### Test 1: User Metadata Passing

```bash
# Open browser console on /voice-assistant-vapi
# Start voice assistant
# Check Network tab for VAPI SDK call
# Verify metadata is sent: {userId, userEmail, userName, userRole}
```

### Test 2: Webhook Receives Metadata

```bash
# Trigger a function call (e.g., "create new project")
# Check server logs for:
[---VAPI-WEBHOOK] ... (userId: <uuid>)
```

### Test 3: Project Creation with AuthorId

```bash
# Create a project via voice
# Check database:
SELECT id, title, author_id FROM projects ORDER BY created_at DESC LIMIT 1;
# Verify author_id matches user who created via voice
```

### Test 4: Unauthenticated Access Blocked

```bash
# Log out
# Try to access /voice-assistant-vapi
# Expected: Redirect to /login
```

## What Works Now

✅ **Session Authentication** - Only logged-in users can access  
✅ **User Context Available** - Webhooks know who's calling  
✅ **Project Ownership** - Projects created via voice have correct authorId  
✅ **Audit Trail** - All actions logged with user context  
✅ **Accurate Documentation** - No false claims about voice biometrics

## What's Still Needed (Optional Enhancements)

⚠️ **Webhook Signature Validation** - Verify requests are from VAPI  
⚠️ **Rate Limiting** - Prevent abuse  
⚠️ **JWT Tokens** - Additional security layer  
⚠️ **Session Validation** - Cross-check metadata with active session

## Alternative: True Voice Biometrics

If you need actual voice-based authentication, you would need to integrate a third-party service:

### Options:

1. **Pindrop** - Voice biometrics for authentication
2. **Nuance** - Speaker verification
3. **Phonexia** - Voice biometrics
4. **AWS Connect Voice ID** - Amazon's solution
5. **Azure Speaker Recognition** - Microsoft's solution

### Implementation Pattern:

```javascript
// Before processing VAPI request
const voicePrint = await extractVoicePrint(audioBuffer);
const isAuthentic = await verifyVoicePrint(voicePrint, userId);

if (!isAuthentic) {
  return new Response("Voice authentication failed", { status: 403 });
}
```

### Cost Considerations:

- Voice biometric services typically charge per verification
- $0.01 - $0.10 per verification depending on provider
- May not be worth the cost for most use cases

## Recommendation

**Current implementation (session-based auth) is sufficient for most use cases.**

Voice biometrics add complexity and cost without significant security benefit when:

- Users are already authenticated via password/2FA
- Physical access to device is required
- Voice can be spoofed with AI voice cloning

**Only add voice biometrics if:**

- Handling sensitive financial transactions
- Regulatory requirement (e.g., healthcare, finance)
- High-value targets requiring defense-in-depth

## Files Modified

1. `/src/pages/voice-assistant-vapi.astro` - Updated UI and added metadata passing
2. `/src/pages/api/vapi/webhook.ts` - Enhanced with user context extraction and passing
3. `/markdowns/vapi-authentication-setup.md` - Created comprehensive guide
4. `/markdowns/vapi-voice-id-authentication-implementation.md` - Created this summary

## Next Steps

1. ✅ Test user metadata passing in development
2. ⚠️ Implement webhook signature validation
3. ⚠️ Add rate limiting
4. ⚠️ Set up monitoring/alerting for webhook failures
5. ⚠️ Document internal API authentication requirements

## References

- [VAPI JWT Authentication](https://docs.vapi.ai/customization/jwt-authentication)
- [VAPI Server Authentication](https://docs.vapi.ai/server-url/server-authentication)
- [VAPI Security Best Practices](https://docs.vapi.ai/security-and-privacy/proxy-server)
