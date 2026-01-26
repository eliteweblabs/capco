# Vapi Custom Button Implementation Guide

## Overview

This guide documents the custom button implementation for the Vapi chat widget, giving you full control over the widget's appearance and trigger behavior.

## What Was Implemented

### Custom Button Features

1. **Custom Styled Button** - A branded "Live Chat" button that matches your site's design
2. **Hidden Default Widget Button** - The Vapi widget's default button is hidden via JavaScript
3. **Programmatic Control** - Custom button triggers the widget by clicking the hidden default button
4. **Tooltip Integration** - Uses existing `Tooltip.astro` component for hover effects
5. **SpeedDial Integration** - Automatically hides SpeedDial when widget opens
6. **No Consent Modal** - Terms acceptance is disabled (`consent-required="false"`)

## File Location

`/src/features/vapi-chat-widget/VapiChatWidget.astro`

## How It Works

### 1. Custom Button (Lines 74-86)

```astro
<button
  id="custom-vapi-trigger"
  class="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-primary-600 px-6 py-4 text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl active:scale-95"
  data-tooltip="Chat with us"
>
  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
  </svg>
  <span>Live Chat</span>
</button>
```

**Features:**
- Positioned bottom-right (matches widget position)
- Tailwind styled with primary brand colors
- Chat bubble icon
- Hover effects (shadow-xl, darker background)
- Active state animation (scale-95)

### 2. Hidden Vapi Widget (Lines 89-111)

The actual Vapi widget is rendered normally but its default button is hidden via JavaScript:

```astro
<vapi-widget
  id="vapi-widget-basic"
  public-key={publicKey}
  assistant-id={assistantId}
  mode="chat"
  consent-required="false"
  ...
></vapi-widget>
```

### 3. JavaScript Control Logic (Lines 128-175)

**Setup Process:**
1. Wait for widget shadow DOM to load
2. Find the default widget button in shadow root
3. Hide it with `display: none`
4. Attach click event to custom button
5. Custom button clicks trigger hidden button

**Key Code:**
```javascript
function setupCustomButton() {
  const checkWidget = setInterval(() => {
    if (!widget?.shadowRoot) return;
    
    const defaultButton = shadowRoot.querySelector('button');
    if (!defaultButton) return;
    
    clearInterval(checkWidget);
    
    // Hide the default button
    defaultButton.style.display = 'none';
    
    // Set up custom button to trigger the widget
    const customButton = document.getElementById('custom-vapi-trigger');
    if (customButton) {
      customButton.addEventListener('click', () => {
        defaultButton.click(); // Trigger widget
      });
    }
  }, 500);
}
```

### 4. SpeedDial Integration (Lines 177-189)

When the custom button is clicked, the SpeedDial is automatically hidden:

```javascript
customButton.addEventListener('click', () => {
  const speedDial = document.querySelector('#speed-dial');
  if (speedDial) {
    speedDial.style.display = 'none';
  }
});
```

### 5. Widget Close Detection (Lines 191-212)

A MutationObserver watches for the widget to close and restores the SpeedDial:

```javascript
const observer = new MutationObserver((mutations) => {
  const isOpen = widget.shadowRoot?.querySelector('[data-state="open"]');
  
  if (!isOpen) {
    const speedDial = document.querySelector('#speed-dial');
    if (speedDial && speedDial.style.display === 'none') {
      speedDial.style.display = 'flex';
    }
  }
});
```

## Customization Options

### Change Button Text

Line 83:
```astro
<span>Live Chat</span>
<!-- Change to: -->
<span>Contact Us</span>
<span>Get Help</span>
<span>Talk to AI</span>
```

### Change Button Icon

Replace the SVG on lines 80-82 with any icon from:
- BoxIcons (use `<i class='bx bx-chat'></i>`)
- Heroicons (current)
- Custom SVG

### Change Button Position

Line 77:
```astro
class="fixed bottom-6 right-6 ..."
<!-- Change to: -->
class="fixed bottom-6 left-6 ..."   <!-- Bottom left -->
class="fixed top-6 right-6 ..."     <!-- Top right -->
```

### Change Button Style

Line 77 - Modify Tailwind classes:
```astro
<!-- Current: Pill style with icon + text -->
class="... rounded-full px-6 py-4 ..."

<!-- Option 1: Round icon-only button -->
class="... rounded-full p-4 ..."  <!-- Remove px-6, hide <span> -->

<!-- Option 2: Square button -->
class="... rounded-lg px-6 py-4 ..."

<!-- Option 3: Different colors -->
class="... bg-green-600 hover:bg-green-700 ..."
```

### Change Tooltip Text

Line 78:
```astro
data-tooltip="Chat with us"
<!-- Change to: -->
data-tooltip="Need help? Click to chat"
data-tooltip="AI Assistant"
```

## Mode Options

### Current: Text Chat Mode

```astro
mode="chat"
chat-first-message={`...`}
chat-placeholder="Type your message..."
```

**Features:**
- Text input with keyboard
- No voice/microphone
- Chat-style interface

### Alternative: Voice Mode

```astro
mode="voice"
show-transcript="true"
empty-voice-message={`Click to start talking...`}
```

**Features:**
- Voice-only (microphone required)
- Real-time transcription
- Click to start/end call

## Testing

1. **Load the page** - Custom button should appear bottom-right
2. **Check console** - Should see `[VAPI-WIDGET]` logs
3. **Hover button** - Tooltip appears
4. **Click button** - Widget opens (no consent modal)
5. **Check SpeedDial** - Should hide when widget opens
6. **Close widget** - SpeedDial should reappear

## Troubleshooting

### Button doesn't trigger widget

**Issue:** Custom button click doesn't open widget
**Check:**
1. Console logs - Look for `[VAPI-WIDGET]` messages
2. Shadow root loaded - May take 500ms-1s
3. Default button found - Check `defaultButton` in console
4. Event listener attached - Should log "Custom button event listener attached"

### Default button still visible

**Issue:** Both buttons showing
**Check:**
1. JavaScript running - Check console for errors
2. `display: none` applied - Inspect shadow DOM
3. Timing issue - Widget may load slowly

### SpeedDial doesn't hide

**Issue:** SpeedDial still visible when widget opens
**Check:**
1. SpeedDial element exists - `#speed-dial` in DOM
2. Event listener attached - Check console logs
3. Display style set - Should be `'none'`

## Browser Compatibility

- Chrome/Edge 79+
- Firefox 86+
- Safari 14.1+
- Mobile browsers with WebRTC support
- Requires HTTPS in production

## Related Components

- `/src/components/common/Tooltip.astro` - Tooltip functionality
- `/src/components/ui/SpeedDial.astro` - Floating action button
- `/src/pages/api/global/global-company-data.ts` - Company data source

## Future Enhancements

### Potential Improvements

1. **Multiple Buttons** - Different buttons for chat vs voice mode
2. **Button Animation** - Add pulsing or color cycling effects
3. **Notification Badge** - Show unread message count
4. **Custom Widget UI** - Build fully custom chat interface (no Vapi widget)
5. **Sound Effects** - Play sound when message received
6. **Mobile Optimization** - Different button styles for mobile
7. **Keyboard Shortcuts** - Ctrl+K to open chat

### Custom Widget (Alternative)

Lines 291-777 contain a **fully custom implementation** that doesn't use the Vapi widget at all. This gives complete control over:
- UI design
- Animation
- Button styles
- Response buttons
- Time slot selection

To use it, set `basic={false}` or don't pass keys to activate the fallback.

## Notes

- The custom button approach works by **delegating** to the hidden default button
- This preserves all Vapi widget functionality (events, state, etc.)
- Shadow DOM manipulation required since widget uses web components
- Polling interval (500ms) ensures widget loads before setup
- 30-second timeout prevents infinite polling

## Summary

This implementation gives you **full visual control** over the chat widget launcher while maintaining **all Vapi functionality** under the hood. The default widget button is hidden and controlled programmatically via your custom button.

Perfect balance of customization + functionality! 🎯
