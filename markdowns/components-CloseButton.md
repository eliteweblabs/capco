# CloseButton Component

A reusable, accessible close/dismiss button with tooltip support.

## Location
`src/components/ui/CloseButton.astro`

## Features
- **Thin X icon**: Two simple crossing lines (not the thick &times; symbol)
- **Red hover state**: Turns red on hover for clear visual feedback
- **Integrated tooltip**: Shows "Close", "Delete", or custom text
- **Accessible**: Proper ARIA labels and focus states
- **Smooth animations**: Color transitions and scale on click

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tooltipText` | `string` | `"Close"` | Text shown in tooltip (e.g., "Close", "Delete", "Dismiss") |
| `position` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | Tooltip position |
| `class` | `string` | `""` | Additional CSS classes |
| `ariaLabel` | `string` | Same as `tooltipText` | Custom ARIA label for accessibility |
| `onclick` | `string` | `undefined` | JavaScript onclick handler |
| `id` | `string` | `undefined` | Button ID |
| `type` | `"button" \| "submit" \| "reset"` | `"button"` | Button type |

## Usage Examples

### Basic Usage (Default "Close")
```astro
---
import CloseButton from "@/components/ui/CloseButton.astro";
---

<CloseButton />
```

### Delete Action
```astro
<CloseButton tooltipText="Delete" />
```

### Dismiss with Custom Position
```astro
<CloseButton tooltipText="Dismiss" position="left" />
```

### With Event Handler
```astro
<CloseButton 
  tooltipText="Remove" 
  onclick="handleRemove(123)"
/>
```

### With Custom Classes and ID
```astro
<CloseButton 
  tooltipText="Close Modal"
  class="absolute top-2 right-2"
  id="modal-close-btn"
/>
```

## Styling

The button includes:
- **Default state**: Gray icon with transparent background
- **Hover state**: 
  - Icon turns red (`text-red-600` / `dark:text-red-500`)
  - Background lightens (`hover:bg-red-50` / `dark:hover:bg-red-950/30`)
- **Active state**: Icon scales down slightly (90%)
- **Focus state**: Primary color outline with offset

## Integration Example

The component is already used in:
- `src/features/banner-alert/components/BannerAlert.astro`

```astro
<div class="banner-dismiss absolute right-4 top-1/2 -translate-y-1/2">
  <CloseButton tooltipText="Dismiss" />
</div>
```

## Accessibility

- Uses proper `<button>` element
- Includes `aria-label` for screen readers
- Keyboard navigable (can be focused with Tab)
- Visible focus indicator
- Semantic HTML structure

## Notes

- The X icon uses thin lines (`stroke-width="1.5"`) for a modern, clean look
- Works in both light and dark modes
- Tooltip automatically appears on hover (via Tooltip component)
- Event handlers can be attached via `onclick` prop or by selecting the button with JavaScript
