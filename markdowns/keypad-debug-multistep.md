# Multi-Step Form Keypad Debugging

## Problem
iOS keypad does not open when programmatically focusing the first input after a step loads.

## Solution (iOS Requirement)
**iOS Safari requires `focus()` to be called within a direct user interaction (click/touch).** No `setTimeout`, promises, or async callbacks—the `focus()` must run synchronously in the event handler.

## Implementation
1. **Tap-to-focus**: Tapping the field wrapper (`.input-wrapper`) focuses the input—direct user gesture, keypad opens
2. **showStep (touch)**: When user taps "Next", focus runs synchronously (no setTimeout) in same handler
3. **Dropdown**: `focusSelector` runs synchronously in trigger click when opening login form
4. **Removed**: "Open keypad" button, `openKeypad()`, delayed retries

## Test Bypass
`testNoCascade={true}` disables cascade animations. Used on login/forgot-password for keypad testing.
