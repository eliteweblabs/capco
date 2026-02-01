# Focus Lock Implementation

## Overview
Implemented focus locking in `MultiStepForm.astro` to prevent inputs from losing focus due to accidental taps on non-interactive elements.

## Problem
Users were experiencing input focus loss when accidentally tapping on background elements, headers, or other non-interactive UI elements while typing on mobile devices.

## Solution
Applied a two-part approach:

### 1. Tabindex Management
Added `tabindex="-1"` to all non-interactive elements:
- Container divs
- Step indicators and progress bars
- Headers and paragraphs
- Icon containers
- Decorative elements

Elements with `tabindex="-1"` cannot receive keyboard focus naturally, but they can still receive mouse/touch focus.

### 2. Focus Lock Event Handler
Added a `mousedown` event listener that:
1. Checks if an input/textarea/select is currently focused
2. Determines if the clicked element is non-interactive (not input, button, link, etc.)
3. If clicking on a non-interactive element, prevents the default mousedown behavior
4. Refocuses the input element immediately after the event

```javascript
document.addEventListener(
  "mousedown",
  (e) => {
    const target = e.target as HTMLElement;
    
    if (!target) return;
    
    // Get the currently focused element
    const focusedElement = document.activeElement as HTMLElement;
    
    // Check if an input/textarea/select is currently focused
    const isInputFocused = focusedElement &&
      (focusedElement.tagName === "INPUT" || 
       focusedElement.tagName === "TEXTAREA" || 
       focusedElement.tagName === "SELECT") &&
      (focusedElement as HTMLInputElement).type !== "hidden";
    
    if (!isInputFocused) return;
    
    // Define interactive elements that SHOULD be allowed to take focus
    const isInteractiveElement = 
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.hasAttribute("contenteditable") ||
      target.closest("button") || // Check if inside a button
      target.closest("a"); // Check if inside a link
    
    // If clicking on a non-interactive element while an input has focus,
    // prevent focus loss
    if (!isInteractiveElement) {
      e.preventDefault();
      setTimeout(() => {
        focusedElement.focus();
      }, 0);
    }
  },
  true
);
```

## Elements That Can Still Receive Focus
- Input fields (text, email, tel, password, etc.)
- Textarea elements
- Select dropdowns
- Buttons (navigation, choice, edit buttons)
- Links

## Benefits
- ✅ Prevents accidental focus loss on mobile devices
- ✅ Maintains smooth typing experience
- ✅ Doesn't interfere with intentional button/link clicks
- ✅ Works with dynamic content
- ✅ No impact on keyboard navigation

## Testing Recommendations
1. Test on mobile devices with touch input
2. Verify that clicking buttons still works normally
3. Ensure keyboard tab navigation still functions properly
4. Test with screen readers to ensure accessibility isn't affected
