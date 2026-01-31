# Stepper Tooltips Feature

## Overview
Added tooltips to each step indicator in the advanced stepper that display the step title on hover, providing users with context about what each step contains without cluttering the UI.

## Visual Design

### Tooltip Appearance
```
        ┌─────────────────────┐
        │  Your email?        │  ← Tooltip
        └──────────┬──────────┘
                   │
                  (2)              ← Step circle
```

**Tooltip Styling:**
- Dark background: `bg-gray-900` / `dark:bg-gray-700`
- White text: `text-white`
- Small font: `text-xs`
- Rounded corners: `rounded-lg`
- Shadow: `shadow-lg`
- Arrow pointing down to step circle

## Implementation

### HTML Structure
```astro
<div class="relative group">
  {/* Step Circle */}
  <span 
    class="... cursor-help"
    data-step-title={step.title}
  >
    <span class="step-number">{step.stepNumber}</span>
  </span>

  {/* Tooltip */}
  <div 
    class="
      absolute bottom-full left-1/2 -translate-x-1/2 mb-2
      px-3 py-1.5 
      bg-gray-900 dark:bg-gray-700 
      text-white text-xs font-medium 
      rounded-lg shadow-lg 
      opacity-0 invisible 
      group-hover:opacity-100 group-hover:visible 
      transition-all duration-200 
      whitespace-nowrap 
      pointer-events-none 
      z-50
    "
  >
    {step.title}
    
    {/* Arrow */}
    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
      <div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
    </div>
  </div>
</div>
```

## CSS Classes Breakdown

### Tooltip Container
```css
/* Positioning */
absolute               /* Relative to step circle */
bottom-full           /* Above the step circle */
left-1/2              /* Center horizontally */
-translate-x-1/2      /* Perfect centering */
mb-2                  /* Gap from circle */

/* Styling */
px-3 py-1.5           /* Comfortable padding */
bg-gray-900           /* Dark background */
dark:bg-gray-700      /* Lighter in dark mode */
text-white            /* White text */
text-xs               /* Small text */
font-medium           /* Slightly bold */
rounded-lg            /* Rounded corners */
shadow-lg             /* Drop shadow */

/* Visibility */
opacity-0             /* Hidden by default */
invisible             /* Not in layout */
group-hover:opacity-100    /* Show on hover */
group-hover:visible        /* Make visible */
transition-all duration-200  /* Smooth fade */

/* Behavior */
whitespace-nowrap     /* Single line */
pointer-events-none   /* Click-through */
z-50                  /* Above other elements */
```

### Tooltip Arrow
```css
/* Container */
absolute              /* Relative to tooltip */
top-full              /* Below tooltip */
left-1/2              /* Center horizontally */
-translate-x-1/2      /* Perfect centering */
-mt-px                /* Overlap tooltip border */

/* Arrow Shape (using borders) */
border-4              /* Size of arrow */
border-transparent    /* Invisible sides */
border-t-gray-900     /* Top border = arrow */
dark:border-t-gray-700  /* Match dark mode */
```

### Step Circle Updates
```css
cursor-help           /* Question mark cursor */
```

## Hover States

### Default State (No Hover)
```
     ( )
      2
```
Tooltip: Hidden (`opacity-0`, `invisible`)

### Hover State
```
┌──────────────┐
│ Your name?   │
└──────┬───────┘
       ↓
      (2)
```
Tooltip: Visible (`opacity-100`, `visible`)

## Animation Timing

```css
transition-all duration-200
```

**Fade In:**
- 0ms → 200ms: Opacity 0 → 1
- Smooth, quick appearance

**Fade Out:**
- 0ms → 200ms: Opacity 1 → 0
- Prevents jarring disappearance

## Accessibility Features

1. **Cursor Indicator:**
   - `cursor-help` shows question mark cursor
   - Signals interactive/informative element

2. **Non-Interactive:**
   - `pointer-events-none` allows click-through
   - Doesn't interfere with step circle interaction

3. **Screen Readers:**
   - `data-step-title` attribute provides programmatic access
   - Could add `aria-label` for better support

4. **High Contrast:**
   - Dark tooltip on light background
   - Light tooltip in dark mode
   - Always readable

## Responsive Behavior

### Desktop
- Full tooltip text displayed
- Ample hover target (40x40px circle)

### Mobile/Touch Devices
- Tooltips may not show (no hover state)
- Consider adding click/tap behavior:

```javascript
circle.addEventListener('click', (e) => {
  e.preventDefault();
  tooltip.classList.toggle('opacity-100');
  tooltip.classList.toggle('visible');
});
```

### Small Screens
```astro
<div class="... whitespace-nowrap">
  {step.title}
</div>
```
- `whitespace-nowrap` prevents wrapping
- May extend beyond screen on very long titles
- Consider truncating or responsive font:

```astro
<div class="max-w-xs truncate">
  {step.title}
</div>
```

## Examples by Step

### Step 1: Email
```
Hover on (1):
┌──────────────┐
│ Your email?  │
└──────┬───────┘
       ↓
      (1)
```

### Step 2: Name
```
Hover on (2):
┌──────────────┐
│ Your name?   │
└──────┬───────┘
       ↓
      (2)
```

### Step 3: Phone
```
Hover on (3):
┌──────────────┐
│ Your phone?  │
└──────┬───────┘
       ↓
      (3)
```

## Dark Mode

### Light Mode
```
Background: bg-gray-900 (almost black)
Arrow:      border-t-gray-900
Text:       text-white
```

### Dark Mode
```
Background: dark:bg-gray-700 (lighter gray)
Arrow:      dark:border-t-gray-700
Text:       text-white
```

Both provide excellent contrast and readability.

## Positioning Logic

### Vertical Alignment
```css
bottom-full    /* Tooltip bottom edge at circle top */
mb-2           /* 8px gap from circle */
```

Result: Tooltip floats above circle with small gap

### Horizontal Alignment
```css
left-1/2           /* Start at circle center */
-translate-x-1/2   /* Move left by half tooltip width */
```

Result: Tooltip perfectly centered over circle

### Arrow Alignment
```css
/* Same centering approach */
left-1/2
-translate-x-1/2
```

Result: Arrow points directly at circle center

## Alternative Designs

### Option 1: Always Visible Labels
```astro
<div class="flex flex-col items-center">
  <span class="circle">1</span>
  <span class="text-xs mt-1">Email</span>  <!-- Always visible -->
</div>
```

**Pros:** No hover needed, always informative
**Cons:** Takes more space, clutters on mobile

### Option 2: Click to Toggle
```astro
<div class="relative group" @click="toggleTooltip">
  <span class="circle">1</span>
  <div class="tooltip" :class="{'visible': showTooltip}">
    {step.title}
  </div>
</div>
```

**Pros:** Works on mobile/touch
**Cons:** Requires JavaScript state management

### Option 3: Native Title Attribute
```astro
<span 
  class="circle"
  title={step.title}  <!-- Browser default tooltip -->
>
  1
</span>
```

**Pros:** Simple, no CSS needed
**Cons:** Styling limited, delay before showing, inconsistent across browsers

### Our Choice: Custom CSS Tooltips
**Pros:**
- Full design control
- Instant appearance
- Consistent across browsers
- Smooth animations
- Dark mode support

**Cons:**
- More code
- May not work on touch devices
- Need to handle overflow

## Enhancement Ideas

### 1. Include Subtitle
```astro
<div class="tooltip">
  <div class="font-medium">{step.title}</div>
  {step.subtitle && (
    <div class="text-xs opacity-75 mt-0.5">{step.subtitle}</div>
  )}
</div>
```

### 2. Show Step Status
```astro
<div class="tooltip">
  {step.title}
  {stepNum < currentStep && (
    <span class="text-green-400 ml-2">✓</span>
  )}
</div>
```

### 3. Multi-Line Support
```css
/* Remove whitespace-nowrap */
max-w-xs          /* Constrain width */
text-center       /* Center multi-line text */
```

### 4. Delayed Appearance
```css
transition-all duration-200 delay-300
/* Wait 300ms before showing */
```

### 5. Touch Device Support
```javascript
// Show tooltip on touch
circle.addEventListener('touchstart', (e) => {
  e.preventDefault();
  showTooltip();
  setTimeout(hideTooltip, 2000);  // Auto-hide after 2s
});
```

## Testing Checklist

- [ ] Tooltip appears on hover
- [ ] Tooltip disappears on mouse leave
- [ ] Arrow points to circle center
- [ ] Tooltip doesn't overflow viewport
- [ ] Works in light mode
- [ ] Works in dark mode
- [ ] Doesn't interfere with clicking
- [ ] Text is readable
- [ ] Animation is smooth
- [ ] Works on all step states (completed/current/future)

## Browser Compatibility

**Supported:**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support

**CSS Features Used:**
- `group-hover:` (Tailwind utility) - ✅ All modern browsers
- `translate` - ✅ All modern browsers
- CSS transitions - ✅ All modern browsers
- CSS borders for arrow - ✅ All modern browsers

**No JavaScript Required:**
Pure CSS implementation works universally.

## Performance

- **No JavaScript:** Zero performance impact
- **CSS Only:** Hardware accelerated
- **Opacity Transitions:** GPU optimized
- **No Layout Shifts:** `pointer-events-none` prevents reflow

## Files Modified

### `/src/components/form/MultiStepForm.astro`
- Wrapped step circle in `<div class="relative group">`
- Added `cursor-help` to step circle
- Added tooltip `<div>` with content
- Added tooltip arrow element
- Added `data-step-title` attribute for programmatic access
