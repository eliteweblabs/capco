# CMS Preloader Component

## Overview

Created a reusable animated preloader component using the library/CMS icon with a zoom-in pulse effect. The component can be used as a page loader or for loading states throughout the application.

## Files Created

1. **Component**: `/src/components/ui/CMSPreloader.astro`
   - Reusable preloader component with zoom-in animation
   - Configurable via props (id, showByDefault, zIndex)
   - Includes pulsing ring effect around the icon
   - Provides global JavaScript API for show/hide/toggle

2. **Test Page**: `/src/pages/tests/cms-preloader-test.astro`
   - Interactive demo page with control buttons
   - Usage examples and documentation
   - Auto-demo functionality

## Features

### Animation Effects

- **Zoom Pulse**: Icon scales from 1x to 1.15x with opacity change
- **Pulsing Ring**: Rounded rectangle that expands and fades out
- **Smooth Transitions**: 1.5s ease-in-out timing for both effects
- **Dark Mode Support**: Adapts colors based on theme

### Props

```astro
<CMSPreloader
  id="cms-preloader"
  Custom
  ID
  (default:
  "cms-preloader")
  showByDefault={false}
  Show
  on
  page
  load
  (default:
  false)
  zIndex="z-50"
  z-index
  class
  (default:
  "z-50")
/>
```

### JavaScript API

```javascript
// Show preloader
window.cmsPreloader.show();

// Hide preloader
window.cmsPreloader.hide();

// Toggle preloader
window.cmsPreloader.toggle();
```

## Usage Examples

### 1. Page Load Preloader

```astro
---
import CMSPreloader from "../components/ui/CMSPreloader.astro";
---

<CMSPreloader showByDefault={true} />

<script>
  window.addEventListener("load", () => {
    setTimeout(() => {
      window.cmsPreloader.hide();
    }, 500);
  });
</script>
```

### 2. Async Operations

```javascript
async function loadData() {
  window.cmsPreloader.show();

  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    // Process data...
  } finally {
    window.cmsPreloader.hide();
  }
}
```

### 3. Form Submission

```javascript
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  window.cmsPreloader.show();

  try {
    await submitForm(new FormData(form));
  } finally {
    window.cmsPreloader.hide();
  }
});
```

### 4. Navigation Loading

```javascript
// Show preloader when navigating
document.querySelectorAll("a[data-loading]").forEach((link) => {
  link.addEventListener("click", () => {
    window.cmsPreloader.show();
  });
});
```

## Design Details

### Icon Choice

- Used the **library** icon from the SimpleIcon system
- Represents content management and documentation
- Clean, recognizable design that scales well

### Animation Timing

- **Duration**: 1.5 seconds per cycle
- **Easing**: ease-in-out for smooth motion
- **Infinite loop**: Continuous animation while visible

### Color Scheme

- **Light Mode**: Primary-600 (main icon), Primary-600/30% (ring)
- **Dark Mode**: Primary-400 (main icon), Primary-400/30% (ring)

## Alternative Mask-Based Approach

The component includes commented-out CSS for an alternative mask-based zoom effect. To use:

1. Uncomment the `.cms-preloader-mask` styles
2. Replace the SVG element with: `<div class="cms-preloader-mask"></div>`
3. Adjust the gradient colors as needed

## Testing

Visit `/tests/cms-preloader-test` to:

- Test show/hide/toggle functionality
- See the animation in action
- View usage examples
- Run auto-demo

## Next Steps

Potential enhancements:

1. Add more icon options (file-text, book, etc.)
2. Variable animation speeds
3. Custom color props
4. Progress indicator variant
5. Integration with routing for automatic page transitions

## Technical Notes

- Uses CSS animations (no JavaScript dependencies for animation)
- Leverages Tailwind's opacity and transition utilities
- Fixed positioning with full viewport coverage
- Accessible (aria-hidden when not visible)
- TypeScript-friendly interface
