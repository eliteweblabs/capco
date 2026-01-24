# Contact Form Auto-Focus Behavior

## Overview
The multi-step contact form automatically focuses the appropriate input/button when each step loads, improving UX and keyboard navigation.

## Implementation Details

### General Behavior (Steps 1, 2, 3, 5, 6, 7)
When a step loads, the first focusable input is automatically focused:
1. Looks for `input:not([type=hidden]):not([readonly])`
2. Falls back to `textarea` if no input found
3. For step 6 (address), specifically targets `#contact-address-search-input`
4. Scrolls the input into view smoothly
5. 150ms delay to ensure DOM is ready

### Special Behavior (Step 4 - SMS Consent)
When step 4 loads, the "yes" button receives special focus styling:
- Finds the button with `data-sms-value="true"`
- Adds dashed outline classes:
  - `!outline`, `!outline-2`, `!outline-dashed`
  - `!outline-primary-500` (light mode)
  - `!outline-offset-2`
  - `dark:!outline-primary-400` (dark mode)
- Also calls `.focus()` for accessibility
- Focus styling is removed when navigating away from step 4

### Initial Page Load
On page load, the first input in step 1 receives focus after 150ms delay.

## Step-by-Step Focus Targets

| Step | Focus Target | Notes |
|------|-------------|-------|
| 1 | First name input | `#contact-first-name` |
| 2 | Email input | `#contact-email` |
| 3 | Phone input | `#contact-phone` |
| 4 | "Yes" button | Special dashed outline styling |
| 5 | Company input | `#contact-company` |
| 6 | Address search input | `#contact-address-search-input` |
| 7 | Message textarea | `#contact-message` |

## Code Location
- File: `src/features/contact-form/components/ContactForm.astro`
- Function: `showStep(stepNumber: number)`
- Lines: ~318-395

## Related Features
- Uses Button component's focus classes
- Integrates with InlineAddressSearch component
- Works with AOS animations
- Supports keyboard Enter navigation
