# SPA Conditional Rendering - Quick Reference

## TL;DR

Make your Astro app feel like a true SPA with automatic show/hide based on data state. No page refreshes needed!

---

## Add Conditional Visibility to Any Element

```astro
<!-- Show when count is 0 -->
<div data-condition="projectCount===0:show" class={items.length > 0 ? "hidden" : ""}>
  <EmptyState />
</div>

<!-- Show when count > 0 -->
<div data-condition="projectCount>0:show" class={items.length === 0 ? "hidden" : ""}>
  <ItemList items={items} />
</div>

<!-- Hide when count > 5 -->
<div data-condition="projectCount>5:hide">
  <BasicFeatures />
</div>
```

**Format**: `data-condition="expression:action"`
- **expression**: JavaScript comparison like `projectCount>0`, `projectCount===0`
- **action**: Either `show` (show when true) or `hide` (hide when true)

---

## Initialize Global State (in your page script)

```typescript
import { refreshManager } from "../../lib/refresh-manager";

// Set initial count
const initialCount = document.querySelectorAll('[data-project-id]').length;
refreshManager.setGlobalState("projectCount", initialCount);

// Start polling for updates
refreshManager.startAutoRefreshWithInterval(5); // every 5 seconds

// Poll for global counts every 10 seconds
setInterval(() => {
  refreshManager.refreshGlobalCounts(userId);
}, 10000);
```

---

## Update Counts on User Actions

```typescript
// When deleting
document.addEventListener('projectDeleted', () => {
  const current = refreshManager.getGlobalState("projectCount") || 0;
  refreshManager.setGlobalState("projectCount", Math.max(0, current - 1));
});

// When creating
document.addEventListener('projectCreated', () => {
  const current = refreshManager.getGlobalState("projectCount") || 0;
  refreshManager.setGlobalState("projectCount", current + 1);
});
```

---

## Live Count in Breadcrumb

```astro
<Breadcrumb 
  items={[
    { label: "Dashboard", href: "/dashboard", icon: "home" },
    { 
      label: `Projects (${projectCount})`,
      current: true,
      refreshField: "projectCount",
      metaValue: projectCount
    }
  ]}
/>
```

---

## Supported Conditions

### Condition Format

All conditions use this format: `data-condition="expression:action"`

**Expression**: JavaScript comparison using global state variables
**Action**: Either `show` or `hide`

### Examples

| Condition | Meaning |
|-----------|---------|
| `projectCount>0:show` | Show when count > 0 |
| `projectCount===0:show` | Show when count is exactly 0 |
| `projectCount>0:hide` | Hide when count > 0 (opposite of show) |
| `projectCount>=5:show` | Show when count is 5 or more |
| `projectCount<10:hide` | Hide when count is less than 10 |

### Legacy Support

These old formats are still supported but not recommended:

| Old Format | New Format |
|-----------|------------|
| `show-if-empty` | `projectCount===0:show` |
| `show-if-has-items` | `projectCount>0:show` |

---

## API Methods

```typescript
// Set global state
refreshManager.setGlobalState("projectCount", 5);

// Get global state
const count = refreshManager.getGlobalState("projectCount");

// Fetch counts from API
await refreshManager.refreshGlobalCounts(userId);

// Force refresh
await refreshManager.forceRefresh();
```

---

## Count-Only API

```bash
# Get just the count (faster than full query)
GET /api/projects/get?count=true
Response: { "count": 5 }

# With filters
GET /api/projects/get?count=true&authorId=abc123
Response: { "count": 2 }
```

---

## Debug in Console

```javascript
// Check state
window.refreshManager.getGlobalState("projectCount")

// Test visibility
window.refreshManager.setGlobalState("projectCount", 0) // should show empty state
window.refreshManager.setGlobalState("projectCount", 5) // should show list
```

---

## Animations

Automatic fade in/out with smooth transitions (300ms).

Animations defined in `src/styles/global.css`:
- `.animate-fadeIn` - Applied when showing
- `.animate-fadeOut` - Applied when hiding

---

## Best Practice Pattern

```astro
---
// Component props
const { items } = Astro.props;
---

<div class="container">
  <!-- Empty state -->
  <div 
    data-condition="show-if-empty" 
    class={items.length > 0 ? "hidden" : ""}
  >
    <EmptyState />
  </div>

  <!-- Content -->
  <div 
    data-condition="show-if-has-items" 
    class={items.length === 0 ? "hidden" : ""}
  >
    <ItemList {items} />
  </div>
</div>

<script>
  import { refreshManager } from "../lib/refresh-manager";
  
  // Initialize
  refreshManager.setGlobalState("projectCount", {items.length});
  refreshManager.startAutoRefreshWithInterval(5);
  
  // Listen for changes
  document.addEventListener('itemDeleted', () => {
    const count = refreshManager.getGlobalState("projectCount") || 0;
    refreshManager.setGlobalState("projectCount", Math.max(0, count - 1));
  });
</script>
```

---

## Files to Know

- **Manager**: `src/lib/refresh-manager.ts`
- **Styles**: `src/styles/global.css`
- **API**: `src/pages/api/projects/get.ts`
- **Full Docs**: `markdowns/spa-conditional-rendering-system.md`

---

## Common Issues

**Not updating?** → Check global state is initialized  
**No animation?** → Ensure both class and data-condition are set  
**Wrong visibility?** → Check initial class condition matches data  
**Too fast/slow?** → Adjust polling intervals (5s for fast, 10s for slow)

---

**Status**: Production Ready ✅  
**Date**: January 30, 2026
