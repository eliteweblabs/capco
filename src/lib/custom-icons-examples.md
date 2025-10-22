# Custom Icon System - Usage Examples

## 🎯 Complete DIY Icon System

No external dependencies, complete control over styling and behavior.

## Usage in Astro Components

```astro
---
import { getIcon } from "../lib/custom-icons";
---

<!-- Basic usage -->
<div set:html={getIcon("user")} />

<!-- With custom styling -->
<div set:html={getIcon("bell", { size: 20, className: "text-red-500" })} />

<!-- Using LucideIcon component (now uses custom system) -->
<LucideIcon name="user" size="lg" variant="primary" />
```

## Usage in TypeScript/JavaScript

```typescript
import { getIcon, getIconHTML, ICON_PRESETS } from "./custom-icons";

// Basic usage
const userIcon = getIcon("user");

// With configuration
const bellIcon = getIcon("bell", {
  size: 24,
  color: "red",
  className: "animate-pulse",
});

// Using presets
const largeIcon = getIcon("settings", ICON_PRESETS.large);
const primaryIcon = getIcon("check", ICON_PRESETS.primary);
```

## Client-side Usage

```javascript
// Import the client-side version
import "/src/lib/custom-icons-client.js";

// Use globally available functions
const iconHTML = window.CustomIcons.getIcon("user", {
  size: 16,
  className: "text-primary-500",
});
```

## Available Icons

### User & Auth

- `user` - User profile
- `user-plus` - Add user
- `log-in` - Login
- `log-out` - Logout

### Files & Documents

- `file` - Generic file
- `file-text` - Text document
- `file-plus` - Add file

### Upload & Download

- `upload` - Upload arrow
- `download` - Download arrow

### Navigation & UI

- `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`
- `menu` - Hamburger menu
- `x` - Close/cancel
- `plus` - Add
- `minus` - Remove

### Status & Actions

- `check` - Checkmark
- `check-circle` - Success check
- `x-circle` - Error/close
- `alert` - Warning

### Communication

- `bell` - Notifications
- `message-circle` - Chat
- `send` - Send message

### Settings & Tools

- `settings` - Gear
- `edit` - Edit/pencil
- `trash` - Delete

### Basic Shapes

- `circle` - Circle
- `square` - Square
- `triangle` - Triangle

### Arrows & Directions

- `arrow`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`

## Configuration Options

```typescript
interface IconConfig {
  size?: number; // Icon size in pixels
  color?: string; // Stroke color
  className?: string; // CSS classes
  strokeWidth?: number; // Stroke width
}
```

## Presets

```typescript
ICON_PRESETS = {
  small: { size: 12, strokeWidth: 1.5 },
  medium: { size: 16, strokeWidth: 2 },
  large: { size: 20, strokeWidth: 2 },
  xl: { size: 24, strokeWidth: 2.5 },

  primary: { className: "text-primary-500 dark:text-primary-400" },
  secondary: { className: "text-neutral-500 dark:text-neutral-400" },
  success: { className: "text-success-500 dark:text-success-400" },
  warning: { className: "text-warning-500 dark:text-warning-400" },
  danger: { className: "text-danger-500 dark:text-danger-400" },
};
```

## Benefits

✅ **No external dependencies** - Pure SVG, no CDN calls  
✅ **Immediate rendering** - No client-side initialization needed  
✅ **Complete control** - Customize size, color, stroke width  
✅ **Consistent styling** - Works with your design system  
✅ **TypeScript support** - Full type safety  
✅ **Lightweight** - Only the icons you need  
✅ **Reliable** - No network dependencies or initialization issues
