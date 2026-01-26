# Vapi Widget Loading Issues - Troubleshooting Guide

## Error: "TypeError: Failed to fetch"

This error means the Vapi widget script is failing to load from the CDN.

## Common Causes & Solutions

### 1. **Network/CDN Issues**

**Check:**
- Are you online?
- Can you access https://unpkg.com in your browser?
- Is your firewall blocking CDN requests?

**Test:**
Open browser console and run:
```javascript
fetch('https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.js')
  .then(r => console.log('✓ CDN accessible:', r.status))
  .catch(e => console.error('✗ CDN blocked:', e));
```

**Solution:**
- Try a different network (mobile hotspot, etc.)
- Disable VPN temporarily
- Check firewall settings

### 2. **Ad Blocker or Privacy Extensions**

**Common blockers:**
- uBlock Origin
- Privacy Badger
- Ghostery
- Brave Browser shields
- Firefox Enhanced Tracking Protection

**Check:**
Look in your browser extensions for anything related to:
- Ad blocking
- Privacy protection
- Script blocking
- Tracking prevention

**Solution:**
Temporarily disable ad blockers/privacy extensions for your localhost or domain.

### 3. **Content Security Policy (CSP)**

**Check:**
Look in browser console for CSP errors like:
```
Refused to load the script 'https://cdn.jsdelivr.net/...' 
because it violates the following Content Security Policy directive
```

**Solution:**
Add to your HTML `<head>`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com;">
```

### 4. **HTTPS/Mixed Content**

**Check:**
- Are you on `http://` (not secure)?
- Widget CDN is `https://`
- Browser blocks mixed HTTP/HTTPS content

**Solution:**
- Use HTTPS for local development
- Or use a CDN that supports HTTP (not recommended)

### 5. **CORS Issues**

**Check Console For:**
```
Access to fetch at 'https://...' from origin 'http://localhost'
has been blocked by CORS policy
```

**Solution:**
This shouldn't happen with public CDNs, but if it does:
- Clear browser cache
- Try incognito/private mode
- Try different browser

## Quick Diagnostic Checklist

Run through these in order:

### Step 1: Check Network
```bash
# In terminal
curl -I https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.js
```

Should return `200 OK`

### Step 2: Check Browser Console
Open DevTools (F12) → Console tab

Look for:
- ❌ Red errors about "Failed to fetch"
- ❌ CSP violations
- ❌ CORS errors
- ❌ 404 or 403 responses

### Step 3: Check Network Tab
Open DevTools (F12) → Network tab

Reload page and look for:
- `widget.umd.js` or `vapi.js` file
- Status should be `200`
- If `Failed` or `Blocked` → ad blocker or firewall

### Step 4: Try Incognito Mode
Open in private/incognito window (disables most extensions)

If it works → extension is blocking it

### Step 5: Try Different Browser
Test in:
- Chrome
- Firefox  
- Safari
- Edge

If works in one but not another → browser-specific issue

## Alternative: Self-Host the Widget

If CDN continues to fail, you can self-host:

### 1. Download the Widget Script
```bash
curl -o public/js/vapi-widget.js https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.js
```

### 2. Update the Script Tag
```astro
<!-- Instead of CDN -->
<script src="/js/vapi-widget.js" async type="text/javascript"></script>
```

### 3. Commit to Git
```bash
git add public/js/vapi-widget.js
git commit -m "Self-host Vapi widget script"
```

## Alternative: Use Native Vapi SDK

Instead of the widget, use the raw SDK:

### 1. Install via NPM
```bash
npm install @vapi-ai/web
```

### 2. Import in Your Code
```javascript
import Vapi from '@vapi-ai/web';

const vapi = new Vapi('YOUR_PUBLIC_KEY');
await vapi.start('ASSISTANT_ID');
```

### 3. Build Custom UI
- Full control over chat interface
- No CDN dependencies
- More reliable

## Check Current Implementation

### Our Fallback System

The widget now tries **two CDNs** in order:

1. **jsdelivr** - `https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.js`
2. **unpkg** - `https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js`

If both fail, the button will be disabled with an error message.

### Check Console Logs

Look for these messages:

**Success:**
```
[VAPI-WIDGET] ✓ Vapi SDK loaded successfully
[VAPI-WIDGET] ✓ Found default button!
```

**Failure:**
```
[VAPI-WIDGET] ❌ Vapi SDK failed to load after 10000 ms
[VAPI-WIDGET] ❌ Both CDNs failed to load
```

## Contact Support

If none of these solutions work:

1. **Take screenshots** of:
   - Browser console errors
   - Network tab showing failed requests
   - Any CSP/CORS errors

2. **Provide details:**
   - Browser version
   - Operating system
   - Any extensions/blockers installed
   - Network environment (corporate, home, etc.)

3. **Check Vapi Status:**
   - https://status.vapi.ai/
   - Their Discord: https://discord.com/invite/pUFNcf2WmH

## Working? Here's Why

If it suddenly starts working:

- ✅ CDN came back online
- ✅ Network issue resolved
- ✅ Extension was disabled
- ✅ Cache was cleared
- ✅ CORS issue fixed itself

Keep monitoring the console for future issues!
