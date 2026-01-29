# Quick Reference: Dismissable Tutorial Tooltips

## Quick Start

Add `"dismissable": true` to any tutorial step's `data-welcome` attribute:

```html
<button data-welcome='{"title": "Quick Tip", "msg": "...", "dismissable": true}'></button>
```

## Complete Example

```html
<!-- Standard step with full navigation -->
<button
  data-welcome='{
    "title": "Welcome",
    "msg": "Let us show you around",
    "position": "bottom",
    "step": 0
  }'
>
  Dashboard
</button>

<!-- Dismissable tooltip - lightweight tip -->
<button
  data-welcome='{
    "title": "Pro Tip",
    "msg": "Press Cmd+K to search",
    "position": "right",
    "dismissable": true,
    "step": 1
  }'
>
  Search
</button>
```

## Visual Differences

### Standard Tutorial Step

- ✅ Previous/Next/Finish buttons
- ✅ Skip Tutorial button
- ✅ Progress bar
- ✅ Main close button (top right)

### Dismissable Tooltip

- ✅ Progress bar
- ✅ Small dismiss X button (top right)
- ❌ No navigation buttons
- ❌ No skip button

## When to Use

### Dismissable (`"dismissable": true`)

- Optional tips and shortcuts
- Contextual help
- Power user features
- Non-critical information

### Standard (default)

- Critical onboarding steps
- Important features
- Sequential workflows
- Features requiring acknowledgment

## All Properties

```json
{
  "title": "Step Title", // Required
  "msg": "Step message", // Required
  "position": "bottom", // Optional: "top"|"bottom"|"left"|"right"|"center"
  "icon": "info", // Optional: BoxIcon name
  "step": 0, // Optional: Step number (auto-assigned if omitted)
  "dismissable": true, // Optional: Makes this step dismissable (default: false)
  "action": "click" // Optional: Custom action
}
```

## Tips

1. **Mix both modes** in one tutorial for best results
2. **Use dismissable** for tips that don't break the flow
3. **Use standard** for critical steps
4. **Order matters** - step numbers determine sequence
5. **Progress persists** - users can resume where they left off

## Files

- Component: `/src/components/common/TutorialOverlay.astro`
- Docs: `/markdowns/tutorial-dismissable-tooltips.md`
- Example: `/src/pages/examples/tutorial-dismissable-example.astro`
