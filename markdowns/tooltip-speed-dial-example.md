# Example: Updating SpeedDial Tooltips

## Current Implementation (Always Visible)

The SpeedDial component currently uses `open={true}` to ensure tooltips are visible on mobile:

```astro
<Tooltip position="left" open={true} text="Feedback" className="-translate-y-2.5">
  <button
    id="feedback-button"
    type="button"
    title="Feedback"
    aria-label="Open feedback form"
    class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-xs hover:bg-primary-800"
  >
    <SimpleIcon name="comment-dots" size="lg" />
  </button>
</Tooltip>
```

## Issue with Current Approach

Since these tooltips are attached to **buttons**, the buttons need to handle click events to perform their action (open feedback form, navigate to contact page, etc.). Using `mobileClickable={true}` would **conflict** with the button's click handler.

## Recommendation

**Keep using `open={true}` for SpeedDial tooltips** because:
1. The tooltips are attached to buttons/interactive elements
2. The buttons need to capture clicks for their primary actions
3. Always-visible tooltips provide clear labels for the speed dial actions
4. The speed dial context benefits from persistent labels

## When to Switch to mobileClickable

If you had tooltip on a **non-interactive element** in SpeedDial (like an info icon that doesn't do anything), then you could use `mobileClickable`:

```astro
<!-- Example: Info icon that just has a tooltip, no action -->
<Tooltip position="left" text="This is informational" mobileClickable={true}>
  <span class="cursor-pointer">
    <SimpleIcon name="info-circle" size="lg" />
  </span>
</Tooltip>
```

## Summary

- **SpeedDial buttons**: Keep `open={true}` ✅
- **Non-interactive info elements**: Use `mobileClickable={true}` ✅
- **Interactive buttons/links**: Use `open={true}` or standard hover ✅
