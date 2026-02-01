# Scroll-Driven Text Reveal Animation

## Overview
Implementation of a scroll-driven text reveal animation for multi-step form titles, inspired by modern CSS scroll-driven animations.

## Implementation Details

### 1. Type Definition
Added `effect` property to `FormStepConfig` interface in `src/lib/multi-step-form-config.ts`:

```typescript
effect?: "reveal-text" | "typewriter"; // Text animation effect for title
```

### 2. Component Logic
Updated `MultiStepForm.astro` to conditionally apply animation classes based on the `effect` property:

```astro
<h2
  class={`inline text-xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white ${
    step.effect === "reveal-text" ? "scroll-reveal-text" : 
    step.effect === "typewriter" ? "typewriter-text" : 
    "scroll-reveal-text"
  }`}
  data-text={step.title}
  set:html={step.title}
  tabindex="-1"
/>
```

### 3. CSS Animation
Added scroll-driven animation styles to `src/styles/global.css`:

#### View Timeline Setup
```css
.scroll-reveal-text {
  view-timeline-name: --reveal-timeline;
  view-timeline-axis: block;
  animation: reveal-text linear;
  animation-timeline: --reveal-timeline;
  animation-range: entry 0% cover 30%;
}
```

#### Keyframe Animation
```css
@keyframes reveal-text {
  from {
    opacity: 0;
    transform: translateY(20px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
```

#### Browser Fallback
```css
@supports not (animation-timeline: --reveal-timeline) {
  .scroll-reveal-text {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
```

## Usage

### Basic Usage
Add the `effect` property to any step in your form configuration:

```typescript
{
  stepNumber: 1,
  title: "Welcome to our form",
  effect: "reveal-text",
  fields: [...],
  buttons: [...]
}
```

### Options
- `"reveal-text"` - Scroll-driven reveal animation with blur and translateY
- `"typewriter"` - Classic typewriter effect (existing)
- No effect specified - Defaults to `"reveal-text"`

## Browser Support

### Full Support
- Chrome 115+
- Edge 115+
- Opera 101+

### Fallback Support
Browsers without scroll-driven animation support will show text immediately without animation, ensuring graceful degradation.

## Animation Behavior

1. **Entry Phase**: Text starts invisible, blurred (10px), and shifted down (20px)
2. **Animation Range**: Animates from when element enters viewport (0%) to 30% of cover
3. **Completion**: Text becomes fully visible, sharp, and in position

## Performance Considerations

- Uses native CSS scroll-driven animations (hardware accelerated)
- No JavaScript required for animation
- Minimal performance impact
- GPU-accelerated transforms and filters

## Customization

To adjust animation timing, modify the `animation-range`:
```css
animation-range: entry 0% cover 50%; /* Slower reveal */
animation-range: entry 0% cover 20%; /* Faster reveal */
```

To adjust animation effects, modify the keyframe values:
```css
@keyframes reveal-text {
  from {
    opacity: 0;
    transform: translateY(40px); /* More dramatic entrance */
    filter: blur(15px); /* More blur */
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
```

## Related Files
- `src/lib/multi-step-form-config.ts` - Type definitions
- `src/components/form/MultiStepForm.astro` - Component implementation
- `src/styles/global.css` - Animation styles
- `src/lib/forms/mep-form-config.ts` - Example usage

## References
- Inspired by: https://codepen.io/shunyadezain/pen/zYNZjJL
- CSS Scroll-driven Animations: https://developer.chrome.com/docs/css-ui/scroll-driven-animations
