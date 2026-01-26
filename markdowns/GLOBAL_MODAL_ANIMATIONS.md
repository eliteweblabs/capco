# Global Modal & Toast Animations

## Overview

Extracted the smooth toast notification animations and made them globally available in `global.css` for use across all modals and notifications in the application.

## What Was Done

### 1. Added Global Animation Keyframes to `global.css`

Created reusable animation keyframes that work beautifully on both desktop and mobile:

#### Desktop Animations
- **`toast-slide-in`** - Slides in from the right with fade
- **`toast-slide-out`** - Slides out to the right with fade

#### Mobile Animations
- **`toast-slide-in-mobile`** - Slides in from the top with fade
- **`toast-slide-out-mobile`** - Slides out to the top with fade

#### Modal-Specific Animations
- **`modal-fade-in`** - Fade in with subtle scale effect
- **`modal-fade-out`** - Fade out with subtle scale effect
- **`modal-content-slide-in`** - Content slides up from bottom (uses mobile toast animation)
- **`modal-content-slide-out`** - Content slides down to bottom (uses mobile toast animation)

### 2. Animation Timing & Easing

All animations use smooth cubic-bezier easing functions:
- **Slide-in**: `cubic-bezier(0.16, 1, 0.3, 1)` - Smooth entrance with slight bounce
- **Slide-out**: `cubic-bezier(0.5, 0, 0.75, 0)` - Quick, clean exit
- **Duration**: 400ms for entrance, 300ms for exit

### 3. Applied to Components

#### UnifiedNotification.astro (Modal Dialogs)
- Added `modal-animated modal-fade-in` to backdrop
- Added `modal-animated modal-content-slide-in` to modal content
- Updated `hide()` function to animate out before removal:
  - Adds `modal-content-slide-out` and `modal-fade-out` classes
  - Waits 300ms for animation to complete before removing from DOM

#### SlotMachineModal.astro (Slot Machine Pickers)
- Added `modal-animated modal-fade-in` to modal backdrop
- Added `modal-animated modal-content-slide-in` to modal content
- Updated `cleanupModal()` function to return a Promise:
  - Adds exit animations
  - Waits 300ms for animation to complete
  - Then unlocks body scroll
- All close handlers now use `setTimeout(() => modal.remove(), 300)`

#### slot-machine-modal.astro (Partial)
- Updated the modal container with animation classes
- Added `modal-animated` and `modal-fade-in` to backdrop
- Added `modal-animated` and `modal-content-slide-in` to content wrapper

## How to Use

### Basic Usage

Simply add these classes to any modal or notification:

```html
<!-- Modal backdrop -->
<div class="modal-animated modal-fade-in">
  <!-- Modal content -->
  <div class="modal-animated modal-content-slide-in">
    <!-- Your content here -->
  </div>
</div>
```

### Closing with Animation

When closing a modal, animate it out before removal:

```javascript
// Remove entrance animations
modalContent.classList.remove("modal-content-slide-in", "modal-fade-in");
// Add exit animations
modalContent.classList.add("modal-content-slide-out");

// Wait for animation, then remove
setTimeout(() => {
  modal.remove();
}, 300);
```

### Available Classes

#### Initial State
- `.modal-animated` - Sets opacity: 0 and will-change for smooth animations

#### Entrance Animations
- `.modal-fade-in` - Fade in with scale (for backdrops)
- `.modal-content-slide-in` - Slide up from bottom (for modal content)
- `.toast-slide-in` - Slide from right (desktop) or top (mobile)

#### Exit Animations
- `.modal-fade-out` - Fade out with scale (for backdrops)
- `.modal-content-slide-out` - Slide down to bottom (for modal content)
- `.toast-slide-out` - Slide to right (desktop) or top (mobile)

## Mobile Responsiveness

Animations automatically adapt to mobile screens (< 640px):
- Desktop: Modals slide in from the right
- Mobile: Modals slide in from the top
- All animations use touch-friendly timing and easing

## Benefits

### User Experience
- **Smooth, polished feel** - Animations make the app feel professional
- **Visual continuity** - Consistent animations across all modals
- **Better perceived performance** - Animations make interactions feel responsive
- **Mobile optimized** - Different animations for different screen sizes

### Developer Experience
- **Reusable** - Define once, use everywhere
- **Maintainable** - All animations in one place (`global.css`)
- **Easy to apply** - Just add classes to elements
- **Consistent** - Same timing and easing across the app

### Performance
- **GPU-accelerated** - Uses `transform` and `opacity` for 60fps animations
- **will-change** - Browser optimization hint for smoother animations
- **No JavaScript overhead** - Pure CSS animations

## Components Using These Animations

1. **Toast Notifications** (`UnifiedNotification.astro`) ✅
2. **Modal Dialogs** (`UnifiedNotification.astro` - renderModal) ✅
3. **Forgot Password Modal** (via UnifiedNotification) ✅
4. **Slot Machine Modals** (`SlotMachineModal.astro`) ✅
5. **Slot Machine Partial** (`slot-machine-modal.astro`) ✅

## Future Enhancements

Consider adding these animation variants:
- `modal-zoom-in` / `modal-zoom-out` - Scale from/to center
- `modal-slide-left` / `modal-slide-right` - Horizontal slides
- `modal-bounce-in` - Playful bounce entrance
- `modal-shake` - Error state animation

## Testing

Test these scenarios:
1. Open/close forgot password modal - should slide smoothly
2. Open/close slot machine modal - should animate in/out
3. Test on mobile - animations should come from top
4. Test on desktop - animations should come from right/bottom
5. Test rapid open/close - animations should not conflict
6. Test toast notifications - should still work perfectly

## Notes

- All animations respect `prefers-reduced-motion` for accessibility
- Animations are non-blocking and won't delay interaction
- The 300ms timing is optimal for perceived performance
- Backdrop and content animate independently for depth effect
