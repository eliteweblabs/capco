# Simple Icon System - Usage Examples

## 🎯 Complete DIY Icon System

No external dependencies, complete control over styling and behavior. Just maps icon names to complete SVG HTML strings.

## Usage in Astro Components

```astro
---
import { getIcon } from "../lib/simple-icons";
---

<!-- Basic usage -->
<div set:html={getIcon("user")} />

<!-- With custom styling -->
<div set:html={getIcon("bell", { size: 20, className: "text-red-500" })} />

<!-- Using SimpleIcon component (now uses simple system) -->
<SimpleIcon name="user" size="lg" variant="primary" />
```

## Usage in TypeScript/JavaScript

```typescript
import { getIcon } from "./simple-icons";

// Basic usage
const userIcon = getIcon("user");

// With configuration
const bellIcon = getIcon("bell", {
  size: 24,
  className: "animate-pulse",
});
```

## Client-side Usage

```javascript
// Import the unified system (works both server & client)
import "/src/lib/simple-icons.ts";

// Use globally available functions (auto-initialized for browser)
const iconHTML = window.SimpleIcons.getIcon("user", {
  size: 16,
  className: "text-primary-500",
});
```

## Available Icons

- `user` - User profile
- `user-plus` - Add user
- `log-in` - Login
- `log-out` - Logout
- `download` - Download
- `list-checks` - Checklist
- `bar-chart-3` - Bar chart
- `users` - Multiple users
- `file-check` - File with checkmark
- `folder` - Folder
- `check-circle` - Success check
- `edit-3` - Edit/pencil
- `clock` - Clock/time
- `adobe` - Adobe/document icon (clean outline style)

## Configuration Options

```typescript
interface IconConfig {
  size?: number; // Icon size in pixels (default: 16)
  className?: string; // CSS classes to apply
}
```

## How It Works

1. Icons are stored as complete SVG HTML strings
2. The `getIcon()` function replaces size and adds className
3. No complex path extraction or viewBox calculations
4. Much more reliable and easier to maintain
