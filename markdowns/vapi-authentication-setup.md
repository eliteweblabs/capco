# VAPI Voice Assistant Authentication Setup

**Date:** January 30, 2026

## Important Clarification

**VAPI.ai does NOT support voice biometrics or speaker identification.** The previous documentation that mentioned "voice authentication" was misleading.

## What VAPI Does NOT Have

❌ **Voice Biometrics** - Cannot identify who is speaking by voice  
❌ **Speaker Verification** - Cannot authenticate users by voice patterns  
❌ **Voice Training** - No ability to train on specific voices  
❌ **Voice-based Access Control** - Cannot restrict based on voice ID

## What VAPI DOES Support

✅ **JWT Authentication** - Token-based user authentication  
✅ **Session Management** - Track authenticated users in calls  
✅ **Server Authentication** - OAuth, Bearer tokens, HMAC  
✅ **Metadata Passing** - Send user context with each call  
✅ **Explicit Start/Stop** - Only active when user clicks start

## Recommended Authentication Strategy

### 1. Session-Based Authentication (Current Implementation)

The voice assistant page already uses Supabase authentication via `checkAuth()`:

```typescript
const { currentUser } = await checkAuth(Astro.cookies);
```

This ensures:

- Only authenticated users can access the page
- Page redirects to login if not authenticated
- User context is available throughout the session

### 2. Pass User Metadata to VAPI

When starting a VAPI call, pass user metadata:

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

**Benefits:**

- VAPI webhooks receive user context
- Assistant knows who it's talking to
- Can personalize responses
- Can enforce role-based permissions

### 3. Validate User in Webhooks

In your webhook endpoint (`/api/vapi/webhook.ts`), validate the user:

```typescript
export async function POST({ request, cookies }) {
  // 1. Verify VAPI webhook signature (if configured)
  const signature = request.headers.get("x-vapi-signature");
  // ... verify signature ...

  // 2. Extract user metadata from call
  const body = await request.json();
  const metadata = body.message?.call?.metadata;
  const userId = metadata?.userId;

  // 3. Validate user session
  const { currentUser } = await checkAuth(cookies);

  // 4. Verify metadata user matches session user
  if (currentUser?.id !== userId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
      }),
      { status: 401 }
    );
  }

  // 5. Process webhook with validated user context
  // ...
}
```

### 4. JWT Authentication (Advanced - Optional)

For additional security, implement JWT tokens:

**Server-side (generate token):**

```typescript
import { SignJWT } from "jose";

async function generateVapiToken(userId: string) {
  const secret = new TextEncoder().encode(process.env.VAPI_JWT_SECRET);

  const token = await new SignJWT({
    userId,
    role: currentUserRole,
    exp: Math.floor(Date.now() / 1000) + 60 * 30, // 30 min
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(secret);

  return token;
}
```

**Client-side (use token):**

```javascript
const token = await fetch("/api/vapi/token").then((r) => r.text());

await vapi.start(assistantId, {
  jwt: token,
  metadata: userMetadata,
});
```

**Configure in VAPI Dashboard:**

- Go to Assistant settings → Security
- Enable JWT Authentication
- Add your JWT secret
- Configure token validation

## Security Best Practices

### 1. Page-Level Protection

✅ Already implemented via `checkAuth()` in Astro page

### 2. Environment Variables

```bash
PUBLIC_VAPI_KEY=your_public_key
PUBLIC_VAPI_ASSISTANT_ID=your_assistant_id
VAPI_PRIVATE_KEY=your_private_key  # For webhooks
VAPI_JWT_SECRET=your_jwt_secret    # For JWT auth (optional)
```

### 3. Webhook Validation

Always validate:

- VAPI signature (prove request is from VAPI)
- User session (prove user is authenticated)
- Metadata match (prove call belongs to user)

### 4. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Example using Redis or similar
const callsInLastHour = await redis.get(`vapi:calls:${userId}`);
if (callsInLastHour > 100) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

### 5. Audit Logging

Log all VAPI interactions for security auditing:

```typescript
await supabase.from("vapi_call_logs").insert({
  user_id: userId,
  call_id: callId,
  started_at: new Date(),
  user_agent: request.headers.get("user-agent"),
});
```

## Current Implementation

The updated `/voice-assistant-vapi.astro` page now:

1. ✅ Shows accurate description (no false claims about voice biometrics)
2. ✅ Uses Supabase session authentication
3. ✅ Passes user metadata to VAPI calls
4. ✅ Displays authenticated user's name in status
5. ✅ Requires explicit start/stop (prevents accidental triggers)

## Testing Authentication

### Test 1: Unauthenticated Access

```bash
# Should redirect to login
curl -I https://your-domain.com/voice-assistant-vapi
# Expected: 302 redirect to /login
```

### Test 2: Authenticated Access

```bash
# Should load page with user context
# Open browser, log in, navigate to /voice-assistant-vapi
# Check console for user metadata in VAPI start call
```

### Test 3: Webhook Validation

```bash
# Test webhook endpoint
curl -X POST https://your-domain.com/api/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": {"call": {"metadata": {"userId": "test"}}}}'
# Expected: 401 Unauthorized (no valid session)
```

## Alternative: Phone Number-Based Authentication

If you're using VAPI for phone calls, you can authenticate users by phone number:

```typescript
// In webhook
const callerPhone = body.message?.call?.customer?.number;

// Look up user by phone
const { data: user } = await supabase
  .from("profiles")
  .select("*")
  .eq("phone", callerPhone)
  .single();

if (!user) {
  return new Response(
    JSON.stringify({
      error: "Unknown phone number",
    }),
    { status: 403 }
  );
}
```

## Summary

**For Web Calls:**

- Use Supabase session auth (already implemented ✅)
- Pass user metadata to VAPI
- Validate in webhooks
- Optional: Add JWT tokens for extra security

**For Phone Calls:**

- Authenticate by phone number lookup
- Prompt for PIN/verification code
- Use caller ID validation

**Security Layers:**

1. Page auth (Supabase) ✅
2. User metadata passing ✅
3. Webhook validation (implement)
4. JWT tokens (optional, advanced)
5. Rate limiting (recommended)
6. Audit logging (recommended)

## Next Steps

1. ✅ Update voice assistant page with accurate authentication description
2. ⚠️ Implement webhook validation with user context
3. ⚠️ Add rate limiting to prevent abuse
4. ⚠️ Set up audit logging for compliance
5. ⚠️ (Optional) Implement JWT authentication for enhanced security

## References

- [VAPI JWT Authentication Docs](https://docs.vapi.ai/customization/jwt-authentication)
- [VAPI Server Authentication](https://docs.vapi.ai/server-url/server-authentication)
- [VAPI Security Best Practices](https://docs.vapi.ai/security-and-privacy/proxy-server)
