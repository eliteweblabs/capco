# VAPI Voice Assistant Security: Physical Access Protection

**Date:** January 30, 2026  
**Status:** ✅ Implemented

## Problem Statement

**User Concern:** "I don't want anyone to be able to command my computer if I walk away without signing out or closing it."

This is a valid security concern. Session-based authentication alone doesn't protect against someone using your computer while you're logged in.

## Solutions Implemented

### 🔒 Solution 1: Password Re-Authentication (PRIMARY)

**What it does:** Requires password verification every time the voice assistant starts.

**How it works:**
1. User clicks "Start Voice Assistant"
2. Modal appears asking for password
3. Password verified via Supabase
4. Only after verification does VAPI call start
5. Process repeats for every new session

**Benefits:**
- ✅ Prevents unauthorized use if you walk away
- ✅ Works even if someone has physical access to your computer
- ✅ No additional cost or third-party services
- ✅ Familiar security pattern (like sudo on Linux)

**Code Location:**
- Frontend: `src/pages/voice-assistant-vapi.astro` (modal + verification logic)
- Backend: `src/pages/api/auth/verify-password.ts` (password verification endpoint)

### ⏱️ Solution 2: Auto-Timeout on Inactivity (SECONDARY)

**What it does:** Automatically stops the voice assistant after 5 minutes of inactivity.

**What counts as activity:**
- User speaks
- Assistant speaks
- Any interaction with the voice session

**How it works:**
1. Timer starts when call begins
2. Timer resets on any activity
3. After 5 minutes of no activity, call automatically ends
4. User sees notification: "Voice assistant stopped due to inactivity"

**Benefits:**
- ✅ Protects if you forget to stop the assistant
- ✅ Prevents idle sessions from staying open
- ✅ Reduces VAPI usage costs
- ✅ Battery-friendly on mobile devices

**Configuration:**
```javascript
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
```

You can adjust this value:
- 2 minutes: `2 * 60 * 1000`
- 10 minutes: `10 * 60 * 1000`
- 1 minute: `1 * 60 * 1000`

### 🎯 Solution 3: Session Binding (EXISTING)

**What it does:** All voice commands tied to authenticated user session.

**Benefits:**
- ✅ Audit trail of who did what
- ✅ Projects created have correct owner
- ✅ Can't impersonate other users

## Security Layers Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Page Access Control                                │
│ • Supabase authentication required                           │
│ • Redirects to login if not authenticated                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Password Re-Authentication (NEW) ✅                │
│ • Must verify password before starting                       │
│ • Protects against physical access                           │
│ • Repeats for every session                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Session Metadata                                    │
│ • User context passed to VAPI                                │
│ • All actions tracked with user ID                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Auto-Timeout (NEW) ✅                              │
│ • Stops after 5 minutes of inactivity                        │
│ • Prevents forgotten sessions                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Explicit Stop                                       │
│ • User must manually stop when done                          │
│ • Clear visual indicator when active                         │
└─────────────────────────────────────────────────────────────┘
```

## Attack Scenarios & Mitigations

### Scenario 1: User Walks Away from Computer

**Without Protection:**
- ❌ Anyone can click "Start" and use voice assistant
- ❌ Can create projects, access data
- ❌ Actions appear to come from legitimate user

**With Protection:**
- ✅ Password modal appears when "Start" clicked
- ✅ Attacker doesn't know password
- ✅ Cannot start voice assistant
- ✅ Even if assistant was already running, auto-timeout stops it

### Scenario 2: User Forgets to Stop Assistant

**Without Protection:**
- ❌ Assistant stays active indefinitely
- ❌ Anyone can give voice commands
- ❌ Wastes VAPI credits

**With Protection:**
- ✅ Auto-timeout stops after 5 minutes
- ✅ User sees notification when returning
- ✅ Must re-authenticate to start again

### Scenario 3: Attacker Knows Password

**Protection:**
- ⚠️ If attacker knows your password, they can use the assistant
- ✅ However, all actions are still logged with your user ID
- ✅ Audit trail exists for investigation
- 💡 Solution: Use strong, unique password + 2FA on Supabase

### Scenario 4: Shoulder Surfing Password

**Protection:**
- ✅ Password field is masked (type="password")
- ✅ No password shown in UI
- ✅ No password stored in browser storage
- 💡 Additional: Consider PIN code instead of full password for quicker entry

## User Experience Flow

### Starting the Assistant

```
1. User clicks "Start Voice Assistant"
   ↓
2. Modal appears: "Verify Your Identity"
   ↓
3. User enters password
   ↓
4. System verifies with Supabase
   ↓
5. If correct: Modal closes, VAPI starts
   If incorrect: Error shown, try again
   ↓
6. Voice assistant is now active
   ↓
7. Inactivity timer starts (5 minutes)
```

### During Use

```
User speaks → Timer resets
Assistant speaks → Timer resets
No activity for 5 min → Auto-stops
```

### When Done

```
User clicks "Stop" → Assistant stops, timer cleared
OR
5 min inactivity → Auto-stops, notification shown
```

## Configuration Options

### Adjust Inactivity Timeout

Edit `src/pages/voice-assistant-vapi.astro`:

```javascript
// Current: 5 minutes
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// More aggressive: 2 minutes
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;

// More lenient: 10 minutes
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
```

### Require Re-Auth After Timeout

Could implement: After auto-timeout, require password again even if user immediately tries to restart.

```javascript
let lastVerificationTime = null;
const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

// Check if verification expired
if (!lastVerificationTime || Date.now() - lastVerificationTime > VERIFICATION_EXPIRY_MS) {
  // Show password modal
}
```

### Add PIN Code Option

For faster re-authentication, could implement 4-digit PIN:

```javascript
// User sets PIN in profile
// Verify PIN instead of full password
// Falls back to password if PIN not set
```

## Alternative Solutions Considered

### ❌ Voice Biometrics (Rejected)

**Why not:**
- VAPI doesn't support it natively
- Requires third-party service ($0.01-$0.10/verification)
- Can be spoofed with AI voice cloning
- More complex than password verification
- Not worth the cost/complexity for this use case

**When it would be worth it:**
- Financial transactions
- Healthcare records access
- Regulatory compliance requirements
- High-value targets requiring defense-in-depth

### ❌ Browser Tab Visibility Detection (Rejected)

**Idea:** Stop assistant when tab loses focus

**Why not:**
- User might legitimately switch tabs
- Doesn't protect if attacker uses same tab
- Annoying user experience
- Can be bypassed

### ✅ Webcam Presence Detection (Future Enhancement)

**Idea:** Use webcam to detect if user is present

**Pros:**
- Passive authentication
- No user action required
- Can detect multiple people

**Cons:**
- Privacy concerns
- Requires webcam permission
- Can be fooled with photos
- More complex implementation

**Recommendation:** Not needed given password + timeout is sufficient

## Testing the Implementation

### Test 1: Password Re-Authentication

```bash
1. Visit /voice-assistant-vapi
2. Click "Start Voice Assistant"
3. Expected: Modal appears asking for password
4. Enter wrong password
5. Expected: Error message, can't start
6. Enter correct password
7. Expected: Modal closes, VAPI starts
```

### Test 2: Auto-Timeout

```bash
1. Start voice assistant (with correct password)
2. Don't interact with it for 5 minutes
3. Expected: Assistant stops automatically
4. Expected: Message shown: "Voice assistant stopped due to inactivity"
5. Try to start again
6. Expected: Password modal appears again
```

### Test 3: Activity Resets Timer

```bash
1. Start voice assistant
2. Wait 4 minutes
3. Say something (any voice input)
4. Wait another 4 minutes
5. Expected: Assistant still active (timer was reset)
6. Wait 5+ minutes with no activity
7. Expected: Now it stops
```

### Test 4: Walking Away Scenario

```bash
1. Start voice assistant
2. Walk away from computer (leave browser open)
3. Have someone else try to use voice commands
4. Expected after 5 min: Assistant has stopped
5. Have them try to restart
6. Expected: Password modal appears, they can't proceed
```

## Monitoring & Logging

### What Gets Logged

```typescript
// Password verification attempts
[AUTH-VERIFY] Password verification failed for user: user@example.com
[AUTH-VERIFY] Password verified for user: user@example.com

// Inactivity timeouts
[VAPI-VOICE] Inactivity timeout - stopping call for security

// All VAPI actions include user context
[VAPI-WEBHOOK] createProject (userId: uuid-123)
```

### Recommended Alerts

Set up alerts for:
- Multiple failed password verification attempts (possible attack)
- Unusual number of VAPI sessions (possible abuse)
- Sessions from unexpected IP addresses

## Security Best Practices

### For Users

1. ✅ **Use a strong password** - Protects against brute force
2. ✅ **Enable 2FA on Supabase** - Additional layer of security
3. ✅ **Lock your computer** - When stepping away (Cmd+Ctrl+Q on Mac, Win+L on Windows)
4. ✅ **Log out when done** - Don't just close browser
5. ✅ **Don't share passwords** - Even with trusted people

### For Administrators

1. ✅ **Monitor verification logs** - Watch for suspicious patterns
2. ✅ **Set up rate limiting** - Prevent brute force attacks
3. ✅ **Enable webhook signature validation** - Verify VAPI requests
4. ✅ **Regular security audits** - Review access logs
5. ✅ **Consider IP whitelisting** - If users are in known locations

## Files Modified/Created

### Modified
1. `src/pages/voice-assistant-vapi.astro`
   - Added password re-authentication modal
   - Added auto-timeout functionality
   - Updated security messaging

### Created
2. `src/pages/api/auth/verify-password.ts`
   - New endpoint for password verification
   - Uses Supabase auth to validate

### Documentation
3. `markdowns/vapi-voice-assistant-security.md` (this file)

## Cost Considerations

### VAPI Usage
- Auto-timeout **reduces** costs by stopping idle sessions
- No additional cost for password verification (handled by Supabase)

### Supabase
- Password verification uses existing auth API
- No additional cost per verification
- Uses same quota as normal logins

### Total Additional Cost
**$0.00** - All features use existing infrastructure

## Comparison with Alternatives

| Solution | Cost | Security | UX | Implementation |
|----------|------|----------|----|----|
| **Password Re-Auth (Implemented)** | $0 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Done |
| **Auto-Timeout (Implemented)** | $0 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Done |
| Voice Biometrics | $0.01-0.10/call | ⭐⭐⭐ | ⭐⭐⭐ | ❌ Complex |
| Webcam Presence | $0 | ⭐⭐⭐⭐ | ⭐⭐ | ❌ Privacy concerns |
| PIN Code | $0 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Future enhancement |

## Recommendation

**Current implementation (Password Re-Auth + Auto-Timeout) is sufficient and recommended.**

- ✅ Zero additional cost
- ✅ High security
- ✅ Good user experience
- ✅ Easy to maintain
- ✅ No privacy concerns

**Do NOT add voice biometrics unless:**
- Regulatory requirement
- High-value financial transactions
- Defense-in-depth is legally required

## Future Enhancements (Optional)

1. **PIN Code Option** - Faster than full password
2. **Biometric (Touch ID/Face ID)** - Use WebAuthn API
3. **Configurable Timeout** - Let users set their own timeout
4. **Activity Detection** - Monitor keyboard/mouse to extend timeout
5. **Multiple Device Support** - Stop on one device when started on another

## Summary

Your concern about physical access security has been addressed with:

1. ✅ **Password re-authentication** before each session
2. ✅ **Auto-timeout** after 5 minutes of inactivity
3. ✅ **Session binding** with user context
4. ✅ **Audit logging** of all actions

**You can now safely walk away from your computer** - even if the browser is open and you're logged in, no one can use the voice assistant without knowing your password.
