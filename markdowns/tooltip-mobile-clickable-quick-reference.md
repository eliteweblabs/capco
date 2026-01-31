# Tooltip mobileClickable Quick Reference

## Quick Start

```astro
import Tooltip from "../components/common/Tooltip.astro";

<!-- Basic usage -->
<Tooltip text="Tooltip text" mobileClickable={true}>
  <span class="cursor-pointer">Your content</span>
</Tooltip>
```

## Props

| Prop              | Type                                   | Default | Description                           |
| ----------------- | -------------------------------------- | ------- | ------------------------------------- |
| `text`            | string                                 | ""      | Tooltip content text                  |
| `position`        | "top" \| "bottom" \| "left" \| "right" | "top"   | Tooltip position                      |
| `className`       | string                                 | ""      | Additional classes for wrapper        |
| `tooltipClass`    | string                                 | ""      | Additional classes for tooltip        |
| `disabled`        | boolean                                | false   | Hide tooltip completely               |
| `open`            | boolean                                | false   | Always show tooltip                   |
| `dismissable`     | boolean                                | false   | Add close button                      |
| `mobileClickable` | boolean                                | false   | Enable tap-to-toggle on mobile ✨ NEW |

## Common Patterns

### Pattern 1: Info Icon

```astro
<Tooltip text="Additional information" position="right" mobileClickable={true}>
  <span class="cursor-pointer">ℹ️</span>
</Tooltip>
```

### Pattern 2: Status Badge

```astro
<Tooltip text="Status details" mobileClickable={true}>
  <span class="cursor-pointer px-2 py-1 bg-green-100 rounded">Active</span>
</Tooltip>
```

### Pattern 3: Truncated Text

```astro
<Tooltip text={fullText} mobileClickable={true}>
  <span class="cursor-pointer truncate max-w-xs">{shortText}</span>
</Tooltip>
```

### Pattern 4: Inline Term

```astro
<p>
  Text with
  <Tooltip text="Definition here" mobileClickable={true}>
    <span class="cursor-pointer underline decoration-dotted">term</span>
  </Tooltip>
  continues.
</p>
```

## Decision Tree

```
Is your element a button, link, or input?
├─ YES → Use open={true} or standard hover
└─ NO → Continue
    ↓
    Should the tooltip always be visible?
    ├─ YES → Use open={true}
    └─ NO → Use mobileClickable={true} ✨
```

## Remember

1. **Always add `cursor-pointer`** to your wrapper element
2. **Don't use on interactive elements** (buttons, links, inputs)
3. **Test on mobile** or use dev tools mobile emulation
4. **Works with all existing tooltip features** (position, className, etc.)

## Browser Support

✅ All modern browsers with touch support
✅ Falls back to hover on desktop
✅ No impact on non-touch devices

## Test Page

View examples at: `/tests/tooltip-mobile-test`
