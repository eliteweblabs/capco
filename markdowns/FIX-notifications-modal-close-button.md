# Fix: Notifications Modal Close Button

## Issue
The close button on the notifications modal was not working because the `CloseButton` component didn't support passing through `data-*` attributes to the underlying button element.

## Root Cause
The `NotificationsModal` component uses `data-modal-hide="notificationsModal"` attribute on the `CloseButton` to identify which buttons should close the modal:

```astro
<CloseButton
  data-modal-hide="notificationsModal"
  tooltipText="Close modal"
/>
```

However, the `CloseButton` component wasn't configured to pass through custom data attributes, so the event listener couldn't find buttons with this attribute:

```typescript
// This query would fail to find the close button
const closeButtons = document.querySelectorAll('[data-modal-hide="notificationsModal"]');
```

## Solution
Updated the `CloseButton` component to:

1. Accept any additional props via rest parameters (`...restProps`)
2. Filter out `data-*` attributes from the rest props
3. Spread these data attributes onto the button element

### Changes Made

**File: `src/components/ui/CloseButton.astro`**

```astro
export interface Props {
  tooltipText?: string;
  position?: "top" | "bottom" | "left" | "right";
  class?: string;
  ariaLabel?: string;
  onclick?: string;
  id?: string;
  type?: "button" | "submit" | "reset";
  [key: string]: any; // Allow any data attributes
}

const {
  tooltipText = "Close",
  position = "top",
  class: className = "",
  ariaLabel,
  onclick,
  id,
  type = "button",
  ...restProps
} = Astro.props;

// Filter out data attributes to pass to button
const dataAttributes = Object.keys(restProps)
  .filter(key => key.startsWith('data-'))
  .reduce((acc, key) => ({ ...acc, [key]: restProps[key] }), {});
```

Then in the template:

```astro
<button
  {type}
  class={`close-button ...`}
  aria-label={finalAriaLabel}
  {onclick}
  {id}
  {...dataAttributes}
>
  <!-- SVG icon -->
</button>
```

## Benefits
1. **Reusable Component**: `CloseButton` can now be used with any modal system that relies on `data-*` attributes
2. **Consistent Behavior**: Close button now works consistently across all modals
3. **Backward Compatible**: Existing usage without data attributes continues to work
4. **Flexible**: Any `data-*` attribute can now be passed through to the button

## Testing
- ✅ Close button now closes the notifications modal
- ✅ Overlay click still closes the modal
- ✅ ESC key still closes the modal
- ✅ Existing modals without data attributes still work

## Related Files
- `/src/components/ui/CloseButton.astro` - Updated to support data attributes
- `/src/components/common/NotificationsModal.astro` - Uses the close button with `data-modal-hide`
- `/src/lib/ux-utils.ts` - Contains the `hideModal` function used by the modal
