# Count Bubble Utility Examples

## Basic Usage

```typescript
import { updateCountBubble, COUNT_BUBBLE_PRESETS } from "./count-bubble-utils";

// Get a parent element
const button = document.getElementById("my-button");

// Update count bubble with default settings
updateCountBubble(button, 5);

// Update with custom options
updateCountBubble(button, 10, {
  bubbleClasses: "custom-bubble-class",
  maxCount: 50,
  showZero: true,
});

// Use presets
updateCountBubble(button, 3, COUNT_BUBBLE_PRESETS.notification);
updateCountBubble(button, 7, COUNT_BUBBLE_PRESETS.punchlist);
updateCountBubble(button, 2, COUNT_BUBBLE_PRESETS.small);
```

## In Astro Components

```javascript
// In a <script> tag within an Astro component
function updateMyCount(count) {
  const element = document.getElementById("my-element");
  if (element) {
    updateCountBubble(element, count);
  }
}
```

## Features

- ✅ Automatically creates count bubbles if they don't exist
- ✅ Updates existing bubbles
- ✅ Hides bubbles when count is 0 (unless showZero is true)
- ✅ Supports max count display (e.g., "99+" for counts over 99)
- ✅ Customizable CSS classes
- ✅ Accessibility support with data attributes
- ✅ Preset configurations for common use cases
- ✅ TypeScript support

## Presets Available

- `COUNT_BUBBLE_PRESETS.notification` - For notification badges
- `COUNT_BUBBLE_PRESETS.punchlist` - For punchlist items
- `COUNT_BUBBLE_PRESETS.small` - For small count displays
