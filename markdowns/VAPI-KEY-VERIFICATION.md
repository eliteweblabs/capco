# VAPI Key Verification Guide

## Issue: 403 Forbidden on Web Widget

Even with a new assistant, you're getting 403 errors. This indicates a **key authentication issue**, not an assistant configuration issue.

## Root Cause: Wrong Key Type

You might be using a **Private/Server API Key** instead of a **Public Key** for the web widget.

### VAPI Has TWO Key Types:

1. **Private/Server Key (VAPI_API_KEY)**
   - Format: Similar to `2dc62c35-17b2-4ef6-8ce0-59b39c28b4f7`
   - Use: Backend API calls, server-side operations
   - Security: Must be kept secret, NEVER exposed in client code
   - Used for: Creating assistants, making calls, server operations

2. **Public Key (PUBLIC_VAPI_KEY)**
   - Format: Different from private key
   - Use: Client-side web widgets, browser code
   - Security: Safe to expose in HTML/JavaScript
   - Used for: Web widgets, client SDK

### How to Find Your PUBLIC Key:

1. **Go to VAPI Dashboard**: https://dashboard.vapi.ai/

2. **Click your profile** (top right) → **"Vapi API Keys"**

3. **Look for TWO sections:**
   - **Private Keys** (for server)
   - **Public Keys** (for web widgets) ← YOU NEED THIS

4. **Copy your PUBLIC Key** (not the private key)

5. **Update your `.env`:**

   ```bash
   # OLD (probably wrong)
   PUBLIC_VAPI_KEY=2dc62c35-17b2-4ef6-8ce0-59b39c28b4f7

   # NEW (get this from dashboard)
   PUBLIC_VAPI_KEY=<your-actual-public-key>
   ```

### If You Don't See a Public Key:

You may need to create one:

1. In the API Keys section
2. Click **"Create Public Key"** or similar
3. Copy the new public key
4. Update `.env`

### Current Situation Analysis:

Your `.env` shows:

- Line 21: `PUBLIC_VAPI_KEY=2dc62c35-17b2-4ef6-8ce0-59b39c28b4f7`
- Line 24: `PUBLIC_VAPI_ASSISTANT_ID=5ee40691-623b-4b7f-ab31-e8553ca9afb3` (new assistant)

The 403 error persisting with a new assistant confirms the key is the issue, not the assistant.

### Verification Steps:

1. **Check VAPI Dashboard → API Keys**
2. **Confirm you have BOTH:**
   - Private Key (for server scripts)
   - Public Key (for web widget)
3. **If missing Public Key**: Create one
4. **Update `.env` with correct Public Key**
5. **Restart dev server**
6. **Test widget**

### Expected Result:

With the correct public key, the widget should connect immediately without any 403 errors.

## Alternative Test:

Try the widget directly in the VAPI dashboard to verify your assistant works:

1. Go to Assistants → Your Assistant
2. Look for "Test" or "Preview" button
3. This will show if the assistant itself is working

If it works in the dashboard but not in your app, it's definitely a key issue.
