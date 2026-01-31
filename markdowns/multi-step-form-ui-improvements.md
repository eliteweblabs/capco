# Multi-Step Form UI Improvements

## Overview

Enhanced the multi-step form component with three key UI improvements for better user experience and visual appeal.

## Changes Implemented

### 1. Fixed Progress Bar at Bottom

Moved the progress bar from the top of the form to a fixed position at the bottom of the screen.

**Before:**

- Progress bar displayed at top of form content
- Scrolled out of view on longer forms

**After:**

- Progress bar fixed to bottom of viewport
- Always visible regardless of scroll position
- Styled with border-top for visual separation
- Added padding to form content to prevent overlap

**Implementation:**

```astro
<!-- Progress Bar - Fixed to bottom -->
<div
  class="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-3 px-4"
>
  <div class="max-w-4xl mx-auto">
    <div class="relative">
      <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          id={`${config.formId}-progress-bar`}
          class="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
          style="width: 0%"
        >
        </div>
      </div>
      <div class="mt-1 text-center">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">
          1 / {config.totalSteps}
        </span>
      </div>
    </div>
  </div>
</div>
```

Key CSS classes:

- `fixed bottom-0 left-0 right-0` - Fixed positioning at bottom
- `z-40` - High z-index to stay above content
- `border-t` - Top border for separation
- Form gets `pb-20` padding when progress bar is enabled

### 2. Single Button Right Alignment

When a step has only one navigation button (no back button), it now aligns to the right side instead of being justified-between.

**Before:**

```html
<div class="flex justify-between gap-3">
  <!-- Button would be on left side when alone -->
</div>
```

**After:**

```astro
<div
  class:list={[
    "flex gap-3",
    step.buttons.filter((b) => b.type !== "choice").length === 1
      ? "justify-end"
      : "justify-between",
  ]}
>
  <!-- Single button aligned right -->
  <!-- Two buttons spread between left/right -->
</div>
```

**Logic:**

- Counts non-choice buttons (prev, next, submit, skip)
- If count === 1: `justify-end` (align right)
- If count >= 2: `justify-between` (spread apart)

### 3. Typewriter Effect for Title Text

Added a smooth typewriter animation that types out the title text character by character when each step loads.

**CSS Animation:**

```css
/* Typewriter animation - types out text character by character */
@keyframes typewriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* Cursor blink animation */
@keyframes blink {
  50% {
    border-color: transparent;
  }
}

/* Typewriter text container */
.typewriter-text {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid currentColor; /* Blinking cursor */
  animation:
    typewriter 0.8s steps(40) forwards,
    blink 0.75s step-end infinite;
  animation-delay: 0s, 0.8s; /* Typewriter first, then blink */
}

/* Remove cursor after typing completes */
.typewriter-text.typed {
  border-right: none;
  animation: none;
}
```

**HTML Update:**

```astro
<h2
  class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white typewriter-text"
  data-text={step.title}
>
  {step.title}
</h2>
```

**JavaScript Logic:**

```typescript
// In multi-step-form-handler.ts showStep() function
const titleElement = targetStep.querySelector(".typewriter-text") as HTMLElement;
if (titleElement) {
  // Reset animation by removing and re-adding class
  titleElement.classList.remove("typed");
  void titleElement.offsetWidth; // Force reflow to restart animation

  // After animation completes (800ms), add 'typed' class to stop cursor
  setTimeout(() => {
    titleElement.classList.add("typed");
  }, 800);
}
```

**Animation Flow:**

1. Title starts with width: 0, hidden
2. Text "types out" over 0.8 seconds using `steps(40)` for character-by-character effect
3. Border-right creates blinking cursor effect
4. After typewriter completes, cursor continues blinking
5. After 800ms, JavaScript adds `typed` class to remove cursor
6. On step change, animation resets and replays

## Files Modified

### 1. `/src/components/form/MultiStepForm.astro`

- Moved progress bar to fixed bottom position
- Added `pb-20` padding to form when progress bar is enabled
- Added `typewriter-text` class to step title
- Updated button container with conditional alignment logic

### 2. `/src/styles/global.css`

- Added `@keyframes typewriter` animation
- Added `@keyframes blink` animation for cursor
- Added `.typewriter-text` styles with overflow/border
- Added `.typewriter-text.typed` to remove cursor after animation

### 3. `/src/lib/multi-step-form-handler.ts`

- Added typewriter reset logic in `showStep()` function
- Removes `typed` class to reset animation
- Forces reflow to restart animation
- Sets timeout to add `typed` class after 800ms

## Visual Result

### Progress Bar

```
┌─────────────────────────────────┐
│                                 │
│   Form Title                    │
│                                 │
│   [Input Field]                 │
│                                 │
│   [Back]          [Next →]      │
│                                 │
└─────────────────────────────────┘
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░    1/8
```

### Single Button (Right Aligned)

```
┌─────────────────────────────────┐
│   What's your name?             │
│                                 │
│   [John]         [Doe]          │
│                                 │
│                     [Next →]    │
└─────────────────────────────────┘
```

### Two Buttons (Spread)

```
┌─────────────────────────────────┐
│   Your email?                   │
│                                 │
│   [your.email@example.com]      │
│                                 │
│   [← Back]          [Next →]    │
└─────────────────────────────────┘
```

### Typewriter Animation Sequence

```
Frame 1 (0ms):    W|
Frame 2 (100ms):  Wh|
Frame 3 (200ms):  Wha|
Frame 4 (300ms):  What|
Frame 5 (400ms):  What'|
Frame 6 (500ms):  What's|
Frame 7 (600ms):  What's y|
Frame 8 (700ms):  What's yo|
Frame 9 (800ms):  What's you|
Frame 10 (900ms): What's your|
...
Final:            What's your name?  (cursor removed)
```

## Benefits

1. **Fixed Progress Bar:**
   - Always visible for orientation
   - Professional, app-like feel
   - Doesn't take up content space
   - Clear visual indicator of position

2. **Right-Aligned Single Button:**
   - Better visual flow (natural reading direction)
   - Consistent with "next/forward" action
   - Matches common UI patterns
   - Cleaner, more intentional layout

3. **Typewriter Effect:**
   - Engaging, modern animation
   - Draws attention to step title
   - Creates a sense of progression
   - Adds personality to the form
   - Smooth, professional execution

## Performance Notes

- Typewriter animation is CSS-based (hardware accelerated)
- JavaScript only manages class toggling, not animation
- Animation duration is short (0.8s) to avoid slowing UX
- `steps(40)` creates smooth character-by-character effect
- Cursor stops blinking after animation to reduce distraction

## Customization

### Adjust Typewriter Speed

Change animation duration in `global.css`:

```css
.typewriter-text {
  animation:
    typewriter 1.2s steps(40) forwards,
    /* Slower */ blink 0.75s step-end infinite;
}
```

And update timeout in `multi-step-form-handler.ts`:

```typescript
setTimeout(() => {
  titleElement.classList.add("typed");
}, 1200); // Match animation duration
```

### Change Progress Bar Position

To move to top instead:

```astro
<div class="fixed top-0 left-0 right-0 z-40 ...">
  <!-- Change bottom-0 to top-0 -->
</div>
```

And update form padding:

```astro
<form class={config.progressBar ? "pt-20" : ""}>
  <!-- Change pb-20 to pt-20 -->
</form>
```

### Disable Typewriter for Specific Steps

Remove `typewriter-text` class from specific step titles:

```astro
<h2
  class:list={[
    "text-2xl font-bold",
    step.stepNumber !== 5 && "typewriter-text", // Skip step 5
  ]}
>
  {step.title}
</h2>
```
