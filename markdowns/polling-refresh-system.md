# Polling-Based Project Refresh System

## Overview

A polling-based system that automatically keeps project data fresh across all users by querying the database every 5 seconds. This approach is ideal for multi-user environments where multiple people are working simultaneously.

## Why Polling Instead of Event-Based?

**Advantages:**
- ✅ Works for multiple concurrent users
- ✅ Catches updates made by anyone, anywhere
- ✅ Simpler implementation - no websocket infrastructure needed
- ✅ Automatically syncs data without user interaction
- ✅ Works even when updates come from external sources (APIs, scripts, etc.)

**Trade-offs:**
- Regular database queries (every 5s by default)
- Small delay before updates appear (max 5s)

## Architecture

```
┌──────────────────┐
│   Browser Tab    │
│                  │
│  ┌────────────┐  │
│  │ Refresh    │  │◄─── Polls every 5s
│  │ Manager    │  │
│  └─────┬──────┘  │
│        │         │
│        ▼         │
│  ┌────────────┐  │
│  │ Elements   │  │◄─── data-refresh="true"
│  │ on Page    │  │     data-project-id="123"
│  └────────────┘  │     data-meta="status"
└──────────────────┘     data-meta-value="50"
        │
        │ /api/projects/refresh
        ▼
┌──────────────────┐
│   Supabase DB    │
│                  │
│  - Projects      │
│  - Punchlist     │
│  - etc.          │
└──────────────────┘
```

## Implementation

### 1. Backend API Endpoint

**File:** `/src/pages/api/projects/refresh.ts`

Accepts an array of project IDs and returns fresh data:

```typescript
POST /api/projects/refresh
{
  "projectIds": [1, 2, 3]
}

Response:
{
  "success": true,
  "projects": [
    {
      "id": 1,
      "updatedAt": "2026-01-27T10:30:00Z",
      "status": 50,
      "dueDate": "2026-02-01T12:00:00Z",
      "assignedToId": "uuid-here",
      "punchlistItems": {
        "completed": 5,
        "total": 10
      }
    }
  ]
}
```

### 2. Frontend Refresh Manager

**File:** `/src/lib/project-refresh-manager.ts`

A class that:
- Scans the page for elements with `data-refresh="true"`
- Extracts unique project IDs
- Polls the API every 5 seconds
- Updates elements when data changes
- Provides visual feedback (flash animation)

**Key Features:**
- Automatic start on page load
- Smart caching to avoid redundant updates
- Custom event dispatching for advanced integrations
- Manual refresh capability

### 3. HTML Element Structure

Elements that should auto-refresh need these attributes:

```html
<span 
  data-refresh="true"
  data-project-id="123"
  data-meta="status"
  data-meta-value="50"
>
  50
</span>
```

**Required Attributes:**
- `data-refresh="true"` - Marks element for auto-refresh
- `data-project-id="123"` - Links to specific project
- `data-meta="fieldName"` - Which field to watch
- `data-meta-value="currentValue"` - Current value for change detection

## Usage Examples

### Example 1: Basic Field

```astro
<td>
  <span 
    data-refresh="true"
    data-project-id={project.id}
    data-meta="status"
    data-meta-value={project.status}
  >
    {project.status}
  </span>
</td>
```

### Example 2: Punchlist Items (Complex Data)

```astro
<td>
  <span 
    data-refresh="true"
    data-project-id={project.id}
    data-meta="punchlistItems"
    data-meta-value={`${project.punchlistItems?.completed || 0} / ${project.punchlistItems?.total || 0}`}
  >
    {project.punchlistItems?.completed || 0} / {project.punchlistItems?.total || 0}
  </span>
</td>
```

### Example 3: Due Date Input

```astro
<input
  type="text"
  data-refresh="true"
  data-project-id={project.id}
  data-meta="dueDate"
  data-meta-value={project.dueDate || ""}
  value={formatDate(project.dueDate)}
  readonly
/>
```

## Control & Configuration

### Start/Stop Polling

```javascript
// Stop polling (e.g., when user navigates away)
window.projectRefreshManager.stop();

// Resume polling
window.projectRefreshManager.start();
```

### Change Polling Interval

```javascript
// Create with custom interval (10 seconds)
window.projectRefreshManager = new ProjectRefreshManager({
  interval: 10000
});
window.projectRefreshManager.start();
```

### Manual Refresh

```javascript
// Refresh a specific project immediately
await window.projectRefreshManager.refreshProject(123);

// Refresh all visible projects
await window.projectRefreshManager.refresh();
```

### Listen for Updates

```javascript
document.addEventListener('projectRefreshed', (event) => {
  const { projectId, project, updatedCount } = event.detail;
  
  console.log(`Project ${projectId} refreshed with ${updatedCount} updates`);
  
  // Custom handling
  if (project.status === 200) {
    // Project completed!
    showCompletionAnimation(projectId);
  }
});
```

## Visual Feedback

When an element updates, it gets a brief blue flash animation:

```css
.refresh-updated {
  animation: flash-update 1s ease-out;
}

@keyframes flash-update {
  0% {
    background-color: rgba(59, 130, 246, 0.3);
  }
  100% {
    background-color: transparent;
  }
}
```

You can customize this in `/src/components/ui/App.astro`.

## Performance Considerations

### Optimizations Built-In:

1. **Smart Scanning**: Only queries for projects visible on the current page
2. **Change Detection**: Only updates elements when values actually change
3. **Batch Requests**: Fetches all visible projects in one API call
4. **Caching**: Stores previous values to minimize unnecessary updates

### Monitoring:

Check browser console for refresh activity:
```
📊 [REFRESH] Starting refresh cycle
📊 [REFRESH] Found 3 unique projects to refresh
📊 [REFRESH] Updating status from 50 to 100
📊 [REFRESH] Updated 2 elements for project 123
📊 [REFRESH] Refresh complete: 5 total updates
```

### Adjust Polling for Your Needs:

- **High activity** (10+ concurrent users): 3-5 second interval
- **Normal activity** (2-10 users): 5-10 second interval  
- **Low activity** (1-2 users): 10-30 second interval

## Current Integrations

### ProjectItem.astro

The following fields auto-refresh:

1. **Punchlist Count**
   - `data-meta="punchlistItems"`
   - Shows: "5 / 10" (completed / total)

2. **Due Date**
   - `data-meta="dueDate"`
   - Input field updates automatically

3. **Status** (ready to add)
   - Add `data-refresh` attributes to status display

4. **Assigned Staff** (ready to add)
   - Add `data-refresh` attributes to staff icon

## Adding New Fields

To make any field auto-refresh:

1. Add the data attributes to the element:
```astro
<span
  data-refresh="true"
  data-project-id={project.id}
  data-meta="yourFieldName"
  data-meta-value={project.yourFieldName}
>
  {project.yourFieldName}
</span>
```

2. Make sure the field is returned by `/api/projects/refresh.ts`:
```typescript
return {
  id: project.id,
  yourFieldName: project.yourFieldName, // Add this
  // ... other fields
};
```

3. That's it! The refresh manager will handle the rest.

## Files Modified/Created

### Created:
- `/src/pages/api/projects/refresh.ts` - API endpoint
- `/src/lib/project-refresh-manager.ts` - Refresh manager class
- `/markdowns/polling-refresh-system.md` - This documentation

### Modified:
- `/src/components/project/ProjectItem.astro` - Added data attributes
- `/src/components/ui/App.astro` - Added refresh manager import & CSS
- `/src/pages/api/projects/upsert.ts` - Reverted metadata changes
- `/src/pages/api/utils/assign-staff.ts` - Reverted metadata changes

## Troubleshooting

### Not seeing updates?

1. Check browser console for refresh logs
2. Verify elements have all required data attributes
3. Confirm API endpoint returns the field you're watching
4. Check that `data-meta-value` matches the field format

### Updates too slow/fast?

Adjust the polling interval:
```javascript
window.projectRefreshManager.stop();
window.projectRefreshManager = new ProjectRefreshManager({
  interval: 3000 // 3 seconds
});
window.projectRefreshManager.start();
```

### High server load?

- Increase polling interval (10-30 seconds)
- Add database caching layer
- Consider adding page visibility detection to pause when tab not active

## Future Enhancements

Possible improvements:

1. **Pause when tab inactive** - Stop polling when user switches tabs
2. **Exponential backoff** - Slow down polling if no changes detected
3. **WebSocket option** - For real-time updates when needed
4. **Selective field refreshing** - Only query changed fields
5. **Delta updates** - Only send changed data from server
6. **Compression** - Gzip API responses for large datasets

## Testing

To test the refresh system:

1. Open project dashboard in two browser windows
2. In window 1, update a project's due date
3. Watch window 2 - it should update within 5 seconds
4. Check console for refresh logs
5. Look for the blue flash animation on updated elements

## Security Notes

- Refresh endpoint requires authentication
- Users only see projects they have access to (RLS policies apply)
- No sensitive data exposed in HTML attributes
- Polling rate limited by server-side logic (TODO: add rate limiting)
