# Typewriter Title Scroll with Fade Effect

**Date:** 2026-02-02  
**Status:** Implemented

## Overview

Enhanced the multi-step form's typewriter title block to handle overflow scenarios gracefully. When the typewriter effect causes text to exceed the visible area, the container now scrolls automatically with a blur/fade effect at the top.

## Implementation

### 1. HTML Structure Changes

Updated `src/components/form/MultiStepForm.astro` to wrap the title `<h2>` element in a scrollable container:

```astro
<div class="title-scroll-container relative" tabindex="-1">
  <div class="title-scroll-fade-top" />
  <div class="title-scroll-wrapper" tabindex="-1">
    <h2 class="typewriter-text" ...>
      {/* Title content */}
    </h2>
  </div>
</div>
```

### 2. CSS Styling

Added styles to `MultiStepForm.astro` global styles:

- **`.title-scroll-container`**: Relative positioned wrapper with max-height of 400px
  - Uses flexbox with `flex-direction: column` for proper content alignment
- **`.title-scroll-wrapper`**: Scrollable container with hidden scrollbar
  - `max-height: 400px`
  - `overflow-y: auto` with hidden scrollbar
  - `scroll-behavior: smooth`
  - **`justify-content: flex-end`** - Keeps text at bottom when content is short
  - **Dynamic alignment**: Switches to `flex-start` when content overflows (via `.has-overflow` class)
- **`.title-scroll-fade-top`**: Gradient fade overlay at the top
  - 60px height gradient from background color to transparent
  - Initially hidden (`opacity: 0`)
  - Shown when `.is-scrolled` class is added
- **Color variables**: `--scroll-fade-color` for light/dark mode support

### 3. Auto-Scroll Functionality

Modified `src/scripts/typewriter-text.ts` to add cursor-anchored scrolling:

```typescript
afterStep: () => {
  // Auto-scroll to keep cursor at fixed vertical position
  const scrollWrapper = element.closest('.title-scroll-wrapper');
  const scrollContainer = element.closest('.title-scroll-container');
  if (scrollWrapper) {
    const hasOverflow = scrollWrapper.scrollHeight > scrollWrapper.clientHeight;
    
    if (hasOverflow) {
      scrollWrapper.classList.add('has-overflow');
      
      // Find the cursor element
      const cursor = element.querySelector('.ti-cursor');
      if (cursor) {
        // Get cursor position relative to container
        const cursorRect = cursor.getBoundingClientRect();
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        
        // Target: keep cursor at 75% down the visible area
        const targetPosition = wrapperRect.height * 0.75;
        const currentCursorPosition = cursorRect.top - wrapperRect.top;
        
        // Calculate scroll adjustment to maintain cursor position
        const scrollAdjustment = currentCursorPosition - targetPosition;
        
        // Apply scroll with 5px threshold to avoid jitter
        if (scrollAdjustment > 5) {
          scrollWrapper.scrollTop += scrollAdjustment;
        }
      }
      
      // Show fade when scrolled
      if (scrollContainer && scrollWrapper.scrollTop > 10) {
        scrollContainer.classList.add('is-scrolled');
      }
    }
  }
}
```

This logic was added to three places:
1. Main `initializeTypewriterInstance()` function
2. MutationObserver for dynamically added nodes
3. MutationObserver for dynamically added children

## Features

### Auto-Scroll Behavior
- Text naturally sits at the **bottom** of the available space when short (like a chat interface)
- When content exceeds the container height, it automatically switches to **top alignment**
- As the typewriter types past the max height, the container scrolls to keep latest text visible
- Smooth scrolling behavior for a polished user experience
- Scrolls to bottom (`scrollTop = scrollHeight`) after each character/step when overflowing
- **Dynamic alignment**: Uses `justify-content: flex-end` by default, switches to `flex-start` when `.has-overflow` is detected

### Fade Effect
- A gradient fade overlay appears at the top when content is scrolled
- Fade activates when `scrollTop > 10px`
- Uses CSS color variables for proper light/dark mode support
- 60px gradient from background color (95% opacity) to transparent

### Hidden Scrollbar
- Scrollbar functionality maintained but visually hidden
- Cross-browser support:
  - Firefox: `scrollbar-width: none`
  - IE/Edge: `-ms-overflow-style: none`
  - Chrome/Safari/Opera: `::-webkit-scrollbar { display: none }`

## Use Cases

This enhancement is particularly useful for:
- Long form titles with multiple lines
- Titles with `<br>` tags that create line breaks
- Dynamic content that varies in length
- Multi-language support where text length varies

## Example

From `contact-form-config.ts`, Step 1 has a multi-line title:

```typescript
title: `<span data-typewriter-pause="1360"></span>Hi, I'm Leah,<br><br>${globalCompanyName}'s project assistant. <br><br>Let's start with your name!`
```

This title uses multiple line breaks and could overflow on smaller screens. With the new scroll container, it gracefully handles the overflow while maintaining the typewriter effect.

## Technical Details

- **Max height**: 400px (configurable via CSS)
- **Container behavior**: Uses flexbox with `justify-content: flex-end` to naturally position text at bottom
- **Overflow detection**: Compares `scrollHeight` vs `clientHeight` to detect when content overflows
- **Dynamic alignment**: Automatically switches from bottom-aligned to top-aligned when content overflows
- **Fade height**: 60px from top
- **Scroll trigger**: 10px scrollTop threshold
- **Performance**: Uses native scroll events, no external libraries
- **Accessibility**: Maintains keyboard navigation and screen reader compatibility

## Files Modified

1. `/src/components/form/MultiStepForm.astro`
   - Added scroll container structure
   - Added CSS for scrolling and fade effect

2. `/src/scripts/typewriter-text.ts`
   - Added `afterStep` callback to TypeIt instances
   - Implemented auto-scroll logic
   - Added scroll detection and class toggling

## Testing Recommendations

1. Test with varying title lengths (short, medium, long)
2. Verify fade appears/disappears correctly
3. Check on mobile, tablet, and desktop viewports
4. Test in light and dark modes
5. Verify with screen readers
6. Test with titles containing HTML (br tags, spans, etc.)

## Future Enhancements

Potential improvements for future iterations:
- Configurable max-height per step
- Optional fade at bottom when not scrolled to end
- Custom fade colors per theme
- Animation for fade appearance/disappearance
