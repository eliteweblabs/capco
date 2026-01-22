# DeleteConfirmButton Component

## Overview
A reusable delete button component with a 2-step confirmation pattern. No system alerts - just a clean, visual confirmation flow. **Uses Button.astro styling patterns and SimpleIcon.astro for consistency.**

## Location
`/src/components/common/DeleteConfirmButton.astro`

## Behavior
1. **First click**: Trash icon changes to `?` icon, button pulses and changes color
2. **Second click (within 3 seconds)**: Executes delete via custom event
3. **Auto-revert**: If not confirmed within timeout, button reverts to trash icon

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | Required | Unique ID for the button |
| `class` | `string` | `""` | Additional CSS classes |
| `timeout` | `number` | `3000` | Milliseconds before auto-revert (3 seconds) |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"sm"` | Button size (matches Button.astro) |
| `variant` | `"icon" \| "button"` | `"icon"` | Icon-only or button with label |
| `label` | `string` | `"Delete"` | Text label (button variant only) |

## Design System Integration

### Uses SimpleIcon.astro
- Trash icon rendered using `getIcon("trash")` from `simple-icons` library
- Consistent icon sizes across the app
- Proper SVG optimization and sizing

### Matches Button.astro Patterns
- **Size classes**: xs/sm/md/lg/xl match Button.astro sizing
- **Color scheme**: Uses Button.astro's danger variant (red-500)
- **Focus states**: Ring styling matches Button.astro
- **Transitions**: Same transition timing and easing
- **Spacing**: Padding and gap spacing consistent with Button.astro

### Size Mappings

```typescript
// Padding matches Button.astro
xs: p-1
sm: p-1.5
md: p-2
lg: p-2.5
xl: p-3

// Icon sizes from SimpleIcon.astro
xs: 12px
sm: 16px
md: 20px
lg: 24px
xl: 32px

// Text sizes for button variant
xs: text-xs
sm: text-sm
md: text-base
lg: text-lg
xl: text-xl
```

## Usage

### Icon Variant (Default - Small)
```astro
<DeleteConfirmButton
  id="delete-item-123"
/>
```

### Extra Small Icon
```astro
<DeleteConfirmButton
  id="delete-item-456"
  size="xs"
/>
```

### Button Variant with Label
```astro
<DeleteConfirmButton
  id="delete-banner-789"
  variant="button"
  size="sm"
  label="Delete"
/>
```

### Large Button
```astro
<DeleteConfirmButton
  id="delete-project-101"
  variant="button"
  size="lg"
  label="Delete Project"
/>
```

### Custom Timeout
```astro
<DeleteConfirmButton
  id="delete-user-789"
  timeout={5000}
  size="lg"
/>
```

## Event Handling

The component dispatches a custom `deleteConfirmed` event when the delete is confirmed. Listen for this event on the parent container:

```javascript
const container = document.getElementById("items-list");

container.addEventListener("deleteConfirmed", (e) => {
  const deleteBtn = e.target.closest(".delete-confirm-btn");
  const buttonId = deleteBtn.id;
  
  // Extract ID from button ID (e.g., "delete-item-123" -> 123)
  const match = buttonId.match(/delete-item-(\d+)/);
  if (match) {
    const itemId = parseInt(match[1], 10);
    deleteItem(itemId);
  }
});
```

## Styling

The component uses the **Button.astro danger variant** styling for consistency:

### Trash State (Default)
- Background: `bg-red-500` (danger color)
- Text: `text-white`
- Hover: `hover:bg-red-600`
- Focus ring: `focus:ring-red-500`
- Matches Button.astro's danger variant

### Confirm State (After First Click)
- Background: `bg-white` 
- Text: `text-red-600` (shows `?` icon)
- Hover: `hover:bg-red-600 hover:text-white` (inverted)
- Animation: Pulsing scale effect
- Focus ring maintained

### Design Benefits
✅ **Consistent with Button.astro**: Uses same size classes, focus rings, and transitions
✅ **Uses SimpleIcon.astro**: Trash icon rendered with proper sizing and optimization  
✅ **Maintains design system**: Colors, spacing, and hover effects match the app
✅ **Accessible**: Proper focus states and ARIA attributes via title

You can extend styling with the `class` prop:
```astro
<DeleteConfirmButton
  id="delete-custom"
  class="shadow-lg"
/>
```

## Examples

### Banner Alerts (Full Implementation)
See: `/src/pages/admin/banner-alerts.astro`

```astro
<!-- In the template -->
{banners.map((banner) => (
  <div>
    <!-- Other buttons -->
    <DeleteConfirmButton
      id={`delete-banner-${banner.id}`}
      variant="button"
      size="sm"
      label="Delete"
    />
  </div>
))}

<!-- In the script -->
<script>
  const bannersList = document.getElementById("banners-list");
  
  bannersList.addEventListener("deleteConfirmed", (e) => {
    const deleteBtn = e.target.closest(".delete-banner-btn");
    if (deleteBtn) {
      const match = deleteBtn.id.match(/delete-banner-(\d+)/);
      if (match) {
        const id = parseInt(match[1], 10);
        deleteBanner(id);
      }
    }
  });

  async function deleteBanner(id) {
    const response = await fetch("/api/banner-alerts/delete", {
      method: "POST",
      body: JSON.stringify({ id })
    });
    // Handle response...
  }
</script>
```

### Media Files Implementation
See: `/src/components/admin/AdminMedia.astro` (lines 471-479, 749-759)

## Benefits

### ✅ Consistent UX
- Same delete pattern across the entire app
- No jarring browser confirm() dialogs
- Visual feedback with animations

### ✅ Reusable
- Single component for all delete operations
- Customizable via props
- Works with any item type

### ✅ Safe
- 2-step confirmation prevents accidental deletions
- Auto-revert if user doesn't confirm
- No action taken on first click

### ✅ Accessible
- Proper ARIA labels via title attribute
- Keyboard accessible (focusable buttons)
- Visual state changes

## Migration Guide

To migrate existing delete buttons:

**Before:**
```astro
<button
  class="delete-btn"
  data-id={item.id}
  onclick="if(confirm('Delete?')) deleteItem(this.dataset.id)"
>
  Delete
</button>
```

**After:**
```astro
<DeleteConfirmButton
  id={`delete-item-${item.id}`}
  variant="button"
  label="Delete"
/>

<script>
  container.addEventListener("deleteConfirmed", (e) => {
    const match = e.target.id.match(/delete-item-(\d+)/);
    if (match) deleteItem(parseInt(match[1]));
  });
</script>
```

## Related Components
- Used in: `/src/pages/admin/banner-alerts.astro`
- Used in: `/src/components/admin/AdminMedia.astro`
- Similar pattern: Media file delete confirmation

## Notes
- The component uses event delegation for better performance
- Works with Astro page transitions (reinitializes on `astro:page-load`)
- The pulsing animation provides clear visual feedback during confirmation state
