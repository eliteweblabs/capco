# VAPI Voice Assistant Security - Quick Reference

## Problem Solved

✅ **"I don't want anyone to command my computer if I walk away"**

## Solutions

### 🔐 Password Re-Authentication
- **ALWAYS** prompts for password before starting
- Protects even if you're logged in
- Can't bypass without knowing password

### ⏱️ Auto-Timeout (5 minutes)
- Stops automatically after inactivity
- Timer resets when you speak
- Prevents forgotten sessions

## How to Use

```
1. Click "Start Voice Assistant"
2. Enter your password in the modal
3. Use voice assistant normally
4. It will auto-stop after 5 min of inactivity
   OR click "Stop" when done
```

## Security Checklist

When you step away:
- ✅ No action needed - auto-timeout protects you
- ✅ If someone tries to use it after timeout, they'll need your password
- ✅ If someone tries to restart it, they'll need your password

Best practices:
- 🔒 Lock your computer (Cmd+Ctrl+Q or Win+L)
- 🔒 Use a strong password
- 🔒 Enable 2FA on your account

## Configuration

Change timeout in `src/pages/voice-assistant-vapi.astro`:

```javascript
// Current: 5 minutes
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// Options:
2 minutes:  2 * 60 * 1000
10 minutes: 10 * 60 * 1000
1 minute:   1 * 60 * 1000
```

## What This Protects Against

✅ Someone using voice assistant if you walk away  
✅ Forgotten sessions staying open  
✅ Unauthorized project creation  
✅ Accidental commands while away

## What It Doesn't Protect Against

❌ Someone who knows your password  
❌ Keyloggers (use strong device security)  
❌ Screen recording malware

## Cost

**$0.00** - No additional cost for these features

## Files

- Frontend: `src/pages/voice-assistant-vapi.astro`
- Backend: `src/pages/api/auth/verify-password.ts`
- Docs: `markdowns/vapi-voice-assistant-security.md`
