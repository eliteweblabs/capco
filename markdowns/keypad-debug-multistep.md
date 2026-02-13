# Multi-Step Form Keypad Debugging

## Problem
iOS keypad does not open when programmatically focusing the first input after a step loads, even though the focus logic runs (page jumps from scrollIntoView).

## Research
- **iOS Safari**: Programmatic focus outside direct user gesture often fails to show keypad (WebKit restriction)
- **Async focus**: `setTimeout`/promises break the user-gesture chain; shorter delays (150ms) may help when chained from a tap
- **Visibility**: Inputs inside `opacity: 0` or `max-height: 0`/`overflow: hidden` parents may not reliably trigger keypad when focused

## Test Bypass (Current)
`testNoCascade={true}` on MultiStepForm disables all cascade/visibility animations:
- Wrappers always visible (no max-height: 0, no opacity: 0)
- No transition delays
- Used on login page to test keypad

**Remove** `testNoCascade` from login.astro when keypad is confirmed working.

## Changes Made
1. **multi-step-form-handler.ts**: Restored capco-style timing - **0ms delay on touch** when advancing steps (stays in same gesture as "Next" tap)
2. **multi-step-form-handler.ts**: 400ms delay on desktop (non-touch)
3. **Sticky "Open keypad" button**: User tap works; programmatic click does not (iOS restriction)
4. **app-globals.ts**: Implemented `openKeypad()` (was never defined)
5. **testNoCascade** (login): Disables wrapper cascade for debugging

## If Keypad Still Fails
- Try `focusDelayMs = 0` or `requestAnimationFrame` (same frame as step show)
- Consider "Tap to type" fallback: overlay that user taps → focuses input (real gesture)
- Check `scrollIntoView` – some report it can steal focus timing; try `preventScroll: true` then manual scroll
