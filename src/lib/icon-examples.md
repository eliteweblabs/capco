# Global Icon System Examples

## Usage in Astro Components

```astro
---
import LucideIcon from "../components/common/LucideIcon.astro";
---

<!-- Basic usage -->
<LucideIcon name="user" />

<!-- With styling -->
<LucideIcon name="bell" variant="primary" size="lg" />

<!-- With presets -->
<LucideIcon name="check" variant="success" size="sm" />

<!-- With background -->
<LucideIcon name="plus" backgroundColor="primary" shape="circle" />
```

## Usage in TypeScript/JavaScript

```typescript
import { getIconClasses, getIconName, generateIconHTML, ICON_PRESETS } from "./icon-styles";

// Get icon classes
const classes = getIconClasses({
  variant: "primary",
  size: "lg",
  backgroundColor: "primary",
  shape: "circle",
});

// Get correct icon name
const iconName = getIconName("user-plus"); // Returns "UserPlus"

// Generate complete HTML
const iconHTML = generateIconHTML("bell", ICON_PRESETS.notification);
```

## Available Presets

- `default` - Standard primary icon
- `inline` - Small secondary icon for text
- `hero` - Large primary icon for headers
- `button` - Standard button icon
- `nav` - Navigation icon
- `status` - Success status icon
- `warning` - Warning icon
- `error` - Error/danger icon
- `badge` - Icon with circular background
- `loading` - Loading state icon
- `disabled` - Disabled state icon

## Client-side Usage

```javascript
// Import the client-side version
import "/src/lib/icon-styles-client.js";

// Use globally available functions
const classes = window.IconStyles.getIconClasses({
  variant: "primary",
  size: "md",
});

const iconHTML = window.IconStyles.generateIconHTML("user", window.IconStyles.ICON_PRESETS.default);
```
