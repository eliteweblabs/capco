# Overlay Component Documentation

## Overview

The `Overlay` component is a reusable backdrop/overlay component for modals, dialogs, drawers, and other UI elements that need a darkened background layer.

## Purpose

Created to standardize overlays across the application and ensure consistency. Previously, each component had its own overlay implementation with slight variations. Now all overlays use the same component.

## Location

`/src/components/ui/Overlay.astro`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | string | `"overlay"` | Unique identifier for the overlay |
| `zIndex` | number/string | `9999` | Z-index value for stacking order |
| `blurAmount` | string | `"sm"` | Backdrop blur: `"none"`, `"sm"`, `"md"`, `"lg"`, `"xl"` |
| `opacity` | string | `"20"` | Background opacity (0-100, e.g., "20" = rgba 0.2) |
| `mobileOnly` | boolean | `false` | Only show on mobile devices (hidden on md+ screens) |
| `additionalClasses` | string | `""` | Additional CSS classes to apply |

## Usage Examples

### Basic Overlay

```astro
---
import Overlay from "@/components/ui/Overlay.astro";
---

<Overlay id="my-overlay" />
```

### Mobile-Only Overlay (SpeedDial)

```astro
<Overlay 
  id="speed-dial-overlay" 
  zIndex={9999} 
  mobileOnly={true} 
/>
```

### Modal Overlay (No Blur)

```astro
<Overlay 
  id="modal-overlay" 
  zIndex={49} 
  blurAmount="none" 
  opacity="50" 
/>
```

### Custom Blur Overlay

```astro
<Overlay 
  id="custom-overlay" 
  zIndex={100} 
  blurAmount="lg" 
  opacity="30" 
/>
```

## Integration Examples

### With Modal Component

```astro
---
import Overlay from "./Overlay.astro";
import CloseButton from "./CloseButton.astro";
---

<Overlay id="my-modal-overlay" zIndex={49} opacity="50" />

<div id="my-modal" class="fixed z-50 ...">
  <!-- Modal content -->
</div>

<script>
  const modal = document.getElementById("my-modal");
  const overlay = document.getElementById("my-modal-overlay");
  
  function showModal() {
    overlay?.classList.remove("hidden");
    overlay?.classList.add("flex");
    modal?.classList.remove("hidden");
  }
  
  function hideModal() {
    overlay?.classList.add("hidden");
    overlay?.classList.remove("flex");
    modal?.classList.add("hidden");
  }
  
  // Close on overlay click
  overlay?.addEventListener("click", hideModal);
</script>
```

### With SpeedDial (Mobile Only)

```astro
---
import Overlay from "./Overlay.astro";
---

<Overlay id="speed-dial-overlay" zIndex={9999} mobileOnly={true} />

<div id="speed-dial">
  <!-- Speed dial content -->
</div>

<script>
  const speedDial = document.getElementById("speed-dial");
  const overlay = document.getElementById("speed-dial-overlay");
  
  speedDial?.addEventListener("click", () => {
    overlay?.classList.toggle("hidden");
  });
</script>
```

## Blur Amount Reference

| Value | Tailwind Class | Visual Effect |
|-------|---------------|---------------|
| `"none"` | _(none)_ | No blur, solid background |
| `"sm"` | `backdrop-blur-sm` | Subtle blur (4px) |
| `"md"` | `backdrop-blur-md` | Medium blur (12px) |
| `"lg"` | `backdrop-blur-lg` | Large blur (16px) |
| `"xl"` | `backdrop-blur-xl` | Extra large blur (24px) |

## Opacity Reference

The `opacity` prop accepts a string from "0" to "100" representing the alpha value:
- `"0"` = transparent (rgba 0.0)
- `"20"` = 20% opacity (rgba 0.2) - default
- `"50"` = 50% opacity (rgba 0.5)
- `"100"` = fully opaque (rgba 1.0)

## Z-Index Guidelines

Common z-index values used in the application:
- `40-49`: Lower overlays (drawers, side panels)
- `49-50`: Modal overlays (overlay at 49, modal at 50)
- `9998-9999`: High priority overlays (speed dial)
- `10000+`: Notifications, toasts, critical UI

**Important**: The modal's z-index should be **1 higher** than its overlay.

## Current Usage

The Overlay component is currently used in:
1. ✅ **SpeedDial** - Mobile-only blur overlay
2. ✅ **PageEditorModal** - Modal backdrop
3. ✅ **showModal()** - Dynamic modal overlays

## Migration Guide

### Before (Old Pattern)

```astro
<div
  id="my-overlay"
  class="fixed inset-0 z-[9999] hidden backdrop-blur-sm bg-black/20 md:hidden"
>
</div>
```

### After (New Pattern)

```astro
<Overlay id="my-overlay" zIndex={9999} blurAmount="sm" opacity="20" mobileOnly={true} />
```

## Benefits

1. **Consistency** - All overlays look and behave the same
2. **Maintainability** - Update once, applies everywhere
3. **Flexibility** - Configurable via props
4. **Type Safety** - TypeScript props validation
5. **Mobile Optimization** - Built-in mobile-only support
6. **Accessibility** - Consistent `data-overlay` attribute

## JavaScript API

### Show Overlay

```javascript
const overlay = document.getElementById("overlay-id");
overlay?.classList.remove("hidden");
overlay?.classList.add("flex");
```

### Hide Overlay

```javascript
const overlay = document.getElementById("overlay-id");
overlay?.classList.add("hidden");
overlay?.classList.remove("flex");
```

### Toggle Overlay

```javascript
const overlay = document.getElementById("overlay-id");
overlay?.classList.toggle("hidden");
overlay?.classList.toggle("flex");
```

### Check if Overlay is Visible

```javascript
const overlay = document.getElementById("overlay-id");
const isVisible = !overlay?.classList.contains("hidden");
```

## Best Practices

1. **Unique IDs**: Always use unique IDs for overlays
2. **Z-Index**: Modal should be 1 higher than its overlay
3. **Click Handlers**: Add click event to close on backdrop click
4. **Mobile First**: Use `mobileOnly` for mobile-specific overlays
5. **Blur Amount**: Use `"none"` for modals, `"sm"` for blur effects
6. **Opacity**: Use `"50"` for modals, `"20"` for subtle overlays

## Styling

The component includes a built-in style for `height-100dvh` to ensure proper full-height coverage on mobile devices (especially iOS):

```css
.height-100dvh {
  height: 100dvh;
}
```

This ensures the overlay covers the entire viewport, including address bars on mobile browsers.

## Data Attributes

All overlays include a `data-overlay` attribute for easy selection:

```javascript
// Select all overlays
const allOverlays = document.querySelectorAll("[data-overlay]");

// Hide all overlays
allOverlays.forEach(overlay => {
  overlay.classList.add("hidden");
});
```

## Future Enhancements

- [ ] Animation support (fade in/out)
- [ ] Click-outside detection
- [ ] Focus trap
- [ ] Accessibility improvements (ARIA labels)
- [ ] Custom color support (beyond black)
- [ ] Gradient overlays
- [ ] Pattern overlays (dots, grid, etc.)

## Support

For questions or issues, check the component source at `/src/components/ui/Overlay.astro` or review existing implementations in:
- `SpeedDial.astro`
- `PageEditorModal.astro`
- `ux-utils.ts` (showModal function)
