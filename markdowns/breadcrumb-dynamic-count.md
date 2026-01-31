# Breadcrumb Dynamic Project Count Implementation

## Overview
Implemented dynamic project count in the breadcrumb that updates automatically via the polling system.

## Changes Made

### 1. HeroDashboard.astro
Added polling support to the breadcrumb item that displays project count:

```astro
{
  label: projectLength === 0
    ? "New<span class='hidden sm:inline'> Project</span>"
    : projectLength === 1
      ? "1 Active Project"
      : `${projectLength} Active Projects`,
  current: true,
  refreshField: "projectCount",      // NEW: Tells polling system to update this
  metaValue: projectLength,          // NEW: Stores initial value for comparison
}
```

### 2. refresh-manager.ts
Added custom callback to format project count with proper singular/plural handling:

```typescript
// Project count - format with singular/plural
this.registerCallback("projectCount", (value: number) => {
  const element = this as any;
  const count = Number(value) || 0;

  if (count === 0) {
    element.innerHTML = "New<span class='hidden sm:inline'> Project</span>";
  } else if (count === 1) {
    element.innerHTML = "1 Active Project";
  } else {
    element.innerHTML = `${count} Active Projects`;
  }
});
```

## How It Works

### Initial Load
1. Dashboard page loads with initial project count from server
2. Breadcrumb displays the initial count
3. Polling system initializes and fetches the real count from database

### Automatic Updates (Every 10 seconds)
1. Polling system calls `refreshManager.refreshGlobalCounts(userId)`
2. Fetches count from `/api/projects/get?count=true` (with role-based filtering)
3. Compares new count with `data-meta-value` attribute
4. If changed, updates the breadcrumb text with animation
5. Properly formats as singular/plural

### Event-Based Updates
The count also updates immediately when:
- **Project Created**: `projectCreated` event fired → count increments
- **Project Deleted**: `projectDeleted` event fired → count decrements

## API Endpoint
Uses existing count-only mode in `/api/projects/get`:

```
GET /api/projects/get?count=true
GET /api/projects/get?count=true&authorId={userId}  // For clients
```

Returns:
```json
{ "count": 5 }
```

## Role-Based Filtering
- **Admins**: See total count of all projects
- **Clients**: See only their own project count (filtered by `authorId`)

## Testing
1. Open dashboard
2. Check browser console for polling logs:
   ```
   🌐 [REFRESH-MANAGER] Fetched project count: 5 (was: 5)
   ```
3. Create a project → count updates immediately
4. Delete a project → count updates immediately
5. Wait 10 seconds → polling updates count

## Debug Commands
```javascript
// Manually trigger count refresh
window.manualRefreshCounts()

// Check current global state
window.refreshManager.getGlobalState('projectCount')

// Check refresh stats
window.refreshManager.getRefreshStats()
```

## Benefits
- ✅ Real-time count updates without page reload
- ✅ Proper singular/plural formatting
- ✅ Role-based filtering (clients see their own count)
- ✅ Smooth animations on count changes
- ✅ Works with existing polling infrastructure
- ✅ Event-driven updates for immediate feedback
