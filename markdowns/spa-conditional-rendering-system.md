# SPA Conditional Rendering System

## Overview
A true SPA (Single Page Application) experience for Astro with automatic conditional rendering based on data state, eliminating the need for page refreshes.

**Date**: January 30, 2026  
**Status**: Production Ready

---

## Problem Solved

### Before
- Dashboard shows ProjectList OR ProjectForm based on `projects.length`
- If all projects are deleted, form doesn't appear until page refresh
- Breadcrumb counts are static and don't update
- User must manually refresh to see state changes

### After
- ✅ Automatic show/hide based on data conditions
- ✅ No page refresh needed when data changes
- ✅ Smooth fade animations for transitions
- ✅ Global count tracking (projectCount, etc.)
- ✅ Breadcrumb counts update live

---

## Architecture

### 1. Global State Management

The `RefreshManager` now maintains global state for aggregate values:

```typescript
// Set global state
refreshManager.setGlobalState("projectCount", 5);

// Get global state
const count = refreshManager.getGlobalState("projectCount");

// Listen for changes
refreshManager.onGlobalStateChange("projectCount", (newCount) => {
  console.log("Project count changed:", newCount);
});
```

### 2. Conditional Rendering with Data Attributes

Use `data-condition="expression:action"` to control visibility based on global state:

```astro
<!-- Show when NO projects exist -->
<div data-condition="projectCount===0:show" class={projects.length > 0 ? "hidden" : ""}>
  <ProjectForm ... />
</div>

<!-- Show when projects exist -->
<div data-condition="projectCount>0:show" class={projects.length === 0 ? "hidden" : ""}>
  <ProjectList ... />
</div>
```

### 3. Custom Condition Expressions

You can use any expression with explicit show/hide actions:

```astro
<!-- Show when count > 5 -->
<div data-condition="projectCount>5:show">
  <AdvancedFeatures />
</div>

<!-- Hide when count === 0 (opposite - shows when count > 0) -->
<div data-condition="projectCount===0:hide">
  <HasItemsMessage />
</div>
```

**Format**: `expression:action`
- **expression**: JavaScript comparison (e.g., `projectCount>0`, `projectCount===5`)
- **action**: Either `show` (visible when true) or `hide` (hidden when true)

---

## Implementation Guide

### Step 1: Update Your Component with Conditional Rendering

**File**: `src/components/project/Dashboard.astro`

```astro
<div class="overflow-x-scroll overflow-y-visible relative mt-8">
  <!-- Project List - shown when projects exist -->
  <div data-condition="projectCount>0:show" class={projects.length === 0 ? "hidden" : ""}>
    <ProjectList {projects} {statusData} {currentUser} />
  </div>

  <!-- New Project Form - shown when no projects exist -->
  <div data-condition="projectCount===0:show" class={projects.length > 0 ? "hidden" : ""}>
    <ProjectForm {currentUser} isNewProject={true} />
  </div>
</div>
```

**Key Points:**
- Both elements are rendered on initial load
- Initial visibility is set by the `class={...}` condition
- `data-condition` controls dynamic visibility after load

### Step 2: Initialize Global State

**File**: `src/pages/project/dashboard.astro`

```typescript
function initializeRefreshSystem() {
  // Count initial projects
  const projectRows = document.querySelectorAll('tr[data-project-id]');
  const initialProjectCount = projectRows.length;
  
  // Set initial global state
  refreshManager.setGlobalState("projectCount", initialProjectCount);
  
  // Start the refresh manager
  refreshManager.startAutoRefreshWithInterval(5); // Poll every 5 seconds
  
  // Poll for global counts every 10 seconds
  setInterval(async () => {
    const userId = document.querySelector('[data-user-id]')?.getAttribute('data-user-id');
    await refreshManager.refreshGlobalCounts(userId);
  }, 10000);
  
  // Immediate refresh
  refreshManager.refreshGlobalCounts(userId);
}
```

### Step 3: Dispatch Events on Data Changes

When a project is deleted or created, dispatch events:

```typescript
// In delete handler
document.dispatchEvent(new CustomEvent('projectDeleted', { 
  detail: { projectId: 123 } 
}));

// In create handler
document.dispatchEvent(new CustomEvent('projectCreated', { 
  detail: { project: newProject } 
}));
```

The dashboard script listens and updates counts:

```typescript
document.addEventListener('projectDeleted', (event) => {
  const currentCount = refreshManager.getGlobalState("projectCount") || 0;
  refreshManager.setGlobalState("projectCount", Math.max(0, currentCount - 1));
});

document.addEventListener('projectCreated', (event) => {
  const currentCount = refreshManager.getGlobalState("projectCount") || 0;
  refreshManager.setGlobalState("projectCount", currentCount + 1);
});
```

### Step 4: Add Count-Only API Support

**File**: `src/pages/api/projects/get.ts`

The API now supports `?count=true` parameter:

```typescript
// Returns just the count, no project data
GET /api/projects/get?count=true
Response: { "count": 5 }

// With filters
GET /api/projects/get?count=true&authorId=abc123
Response: { "count": 2 }
```

### Step 5: Update Breadcrumb for Live Counts

**File**: `src/components/common/Breadcrumb.astro`

```astro
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
  icon?: string;
  // For polling support
  refreshField?: string;    // e.g., "projectCount"
  projectId?: number;       // for project-specific data
  userId?: string;          // for user-specific data
  metaValue?: any;          // current raw value
}
```

Usage:

```astro
<Breadcrumb 
  items={[
    { label: "Dashboard", href: "/project/dashboard", icon: "home" },
    { 
      label: `Projects (${projectCount})`,
      current: true,
      refreshField: "projectCount",
      metaValue: projectCount
    }
  ]}
/>
```

The count will automatically update via polling!

---

## Supported Conditions

### Condition Format

**Syntax**: `data-condition="expression:action"`

- **expression**: JavaScript comparison expression using global state variables
- **action**: Either `show` or `hide`

### Examples

| Condition | When Element is Visible |
|-----------|------------------------|
| `projectCount>0:show` | When count is greater than 0 |
| `projectCount===0:show` | When count is exactly 0 |
| `projectCount>=5:show` | When count is 5 or more |
| `projectCount<10:show` | When count is less than 10 |
| `projectCount>0:hide` | When count is 0 (inverse logic) |

### Legacy Formats (Still Supported)

For backwards compatibility, these old formats still work:

| Legacy Format | Equivalent New Format |
|--------------|----------------------|
| `show-if-empty` | `projectCount===0:show` |
| `show-if-has-items` | `projectCount>0:show` |

**Recommendation**: Use the new `expression:action` format for clarity and flexibility.

---

## Animation System

### Fade Animations

Transitions are smooth with CSS animations:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.98); }
}
```

### Animation Classes

- `.animate-fadeIn` - Applied when showing element
- `.animate-fadeOut` - Applied when hiding element

Duration: 300ms with cubic-bezier easing

---

## Refresh Manager API

### Global State Methods

```typescript
// Set a global value
refreshManager.setGlobalState(key: string, value: any): void

// Get a global value
refreshManager.getGlobalState(key: string): any

// Fetch global counts from API
refreshManager.refreshGlobalCounts(userId?: string): Promise<void>

// Register callback for state changes
refreshManager.onGlobalStateChange(key: string, callback: (value: any) => void): void
```

### Existing Methods (Still Available)

```typescript
// Update field across all matching elements
refreshManager.updateField(fieldName: string, newValue: any, projectId?: string): void

// Start/stop auto-refresh
refreshManager.startAutoRefresh(): void
refreshManager.stopAutoRefresh(): void

// Set refresh interval
refreshManager.setRefreshInterval(intervalMs: number): void

// Force immediate refresh
refreshManager.forceRefresh(): Promise<void>
```

---

## Best Practices

### 1. Always Set Initial State

```typescript
// ✅ Good - explicit initial state
refreshManager.setGlobalState("projectCount", projects.length);

// ❌ Bad - state will be undefined until first poll
// (missing initialization)
```

### 2. Use Both Class and Data-Condition

```astro
<!-- ✅ Good - initial visibility + dynamic updates -->
<div data-condition="projectCount===0:show" class={projects.length > 0 ? "hidden" : ""}>

<!-- ❌ Bad - no initial visibility control -->
<div data-condition="projectCount===0:show">
```

### 3. Use Explicit Show/Hide Actions

```astro
<!-- ✅ Good - clear intent -->
<div data-condition="projectCount>0:show">

<!-- ❌ Bad - ambiguous (legacy format) -->
<div data-condition="show-if-has-items">
```

### 3. Dispatch Events for Immediate Updates

```typescript
// ✅ Good - immediate update + eventual consistency from polling
document.dispatchEvent(new CustomEvent('projectDeleted'));
refreshManager.setGlobalState("projectCount", newCount);

// ❌ Bad - wait 10 seconds for next poll
// (no immediate update)
```

### 4. Use Appropriate Poll Intervals

```typescript
// Project-level updates (fast changes)
refreshManager.startAutoRefreshWithInterval(5); // 5 seconds

// Global counts (slower changes)
setInterval(() => refreshManager.refreshGlobalCounts(), 10000); // 10 seconds
```

---

## Testing Checklist

- [ ] Initial state shows correct content (form vs list)
- [ ] Deleting last project shows form without refresh
- [ ] Creating first project shows list without refresh
- [ ] Transitions are smooth with fade animation
- [ ] Breadcrumb counts update automatically
- [ ] Multiple browser tabs stay in sync
- [ ] Rapid changes don't cause UI flicker
- [ ] Console shows clear logging of state changes

---

## Debugging

### Console Logs

Look for these prefixes:
- `🌐 [REFRESH-MANAGER]` - Global state changes
- `🔄 [REFRESH-MANAGER]` - Field-level updates
- `🔄 [DASHBOARD]` - Dashboard initialization

### Manual Testing

```javascript
// In browser console:

// Check current state
window.refreshManager.getGlobalState("projectCount")

// Force a state change
window.refreshManager.setGlobalState("projectCount", 0)
// Should hide list, show form

window.refreshManager.setGlobalState("projectCount", 5)
// Should show list, hide form

// Force immediate refresh
window.refreshManager.forceRefresh()
```

---

## Migration Guide

### Before (Traditional Astro Conditional)

```astro
{projects.length > 0 ? (
  <ProjectList projects={projects} />
) : (
  <ProjectForm />
)}
```

**Problem**: Only one component is rendered. Can't dynamically switch without page reload.

### After (SPA Conditional)

```astro
<div data-condition="show-if-has-items" class={projects.length === 0 ? "hidden" : ""}>
  <ProjectList projects={projects} />
</div>

<div data-condition="show-if-empty" class={projects.length > 0 ? "hidden" : ""}>
  <ProjectForm />
</div>
```

**Solution**: Both components are rendered but visibility is controlled dynamically.

---

## Performance Considerations

### Polling Strategy

| Type | Interval | Reason |
|------|----------|--------|
| Project fields | 5s | Fast-changing data (status, notes, etc.) |
| Global counts | 10s | Slower-changing aggregates |
| Manual trigger | 0ms | Immediate after user action |

### Optimization Tips

1. **Use count-only API** - Don't fetch full project data for counts
2. **Client-side increment/decrement** - Optimistic updates
3. **Debounce events** - Prevent duplicate updates
4. **Conditional polling** - Only poll on active tabs

```typescript
// Stop polling when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    refreshManager.stopAutoRefresh();
  } else {
    refreshManager.startAutoRefresh();
  }
});
```

---

## Files Modified

- ✅ `src/lib/refresh-manager.ts` - Added global state + conditional visibility
- ✅ `src/components/project/Dashboard.astro` - Conditional rendering
- ✅ `src/pages/project/dashboard.astro` - Initialize global state + polling
- ✅ `src/components/common/Breadcrumb.astro` - Support refresh fields
- ✅ `src/pages/api/projects/get.ts` - Count-only API mode
- ✅ `src/styles/global.css` - Fade animations

---

## Future Enhancements

### Possible Additions

1. **Multi-state conditions** - `data-condition="projectCount>0&&userRole===Admin"`
2. **Transition groups** - Animate list additions/removals
3. **Optimistic UI** - Show changes before API confirms
4. **WebSocket support** - Replace polling with real-time updates
5. **Offline mode** - Cache state in localStorage
6. **State persistence** - Survive page reloads

### Community Patterns

- **Loading states** - `data-condition="isLoading===true"`
- **Error states** - `data-condition="hasError===true"`
- **Permission gates** - `data-condition="userRole===Admin"`
- **Feature flags** - `data-condition="featureEnabled===true"`

---

## Summary

This system provides a **true SPA experience** in Astro by:

1. ✅ **Rendering all content** on initial load
2. ✅ **Controlling visibility** with data attributes
3. ✅ **Polling for changes** at appropriate intervals
4. ✅ **Animating transitions** for smooth UX
5. ✅ **Dispatching events** for immediate updates

**Result**: No page refreshes needed, ever. The app feels like a modern React SPA while maintaining Astro's server-first architecture.
