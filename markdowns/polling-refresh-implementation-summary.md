# Polling-Based Refresh System - Implementation Summary

## What Changed

Switched from an event-based refresh system to a **polling-based system** that's better suited for multi-user environments.

## Why the Change?

The original event-based system only updated elements when individual API calls returned metadata. This doesn't work well when:
- Multiple users are working simultaneously
- Updates come from external sources
- Changes happen outside the current user's session

**Polling solves this** by regularly checking the database for changes, keeping all users in sync automatically.

## New Architecture

```
Every 5 seconds:
1. Scan page for elements with data-refresh="true"
2. Extract unique project IDs
3. Fetch fresh data from /api/projects/refresh
4. Update elements if values changed
5. Show blue flash animation on updates
```

## Files Created

### 1. `/src/pages/api/projects/refresh.ts`
API endpoint that accepts project IDs and returns fresh data:
- `updatedAt`, `status`, `dueDate`, `assignedToId`, `punchlistItems`
- Respects authentication and RLS policies
- Returns transformed, ready-to-use data

### 2. `/src/lib/project-refresh-manager.ts`
Main refresh manager class:
- Auto-starts on page load
- Polls every 5 seconds (configurable)
- Smart change detection
- Visual feedback on updates
- Custom event dispatching
- Manual refresh capability
- Caching to avoid redundant updates

### 3. `/markdowns/polling-refresh-system.md`
Complete documentation including:
- Architecture overview
- Usage examples
- Configuration options
- Performance considerations
- Troubleshooting guide

## Files Modified

### `/src/components/project/ProjectItem.astro`
**Added data attributes:**
```astro
<tr data-refresh="true" data-project-id={project.id}>
```

**Updated fields to auto-refresh:**
1. Punchlist count: `data-meta="punchlistItems"`
2. Due date: `data-meta="dueDate"`

**Removed:**
- `updateProjectElements()` function (no longer needed)
- Metadata-based updates in `adjustDueDate()`

### `/src/components/ui/App.astro`
**Added:**
- Import for refresh manager script
- CSS for flash animation on updates

### `/src/pages/api/projects/upsert.ts`
**Reverted:**
- Removed metadata from responses (not needed with polling)

### `/src/pages/api/utils/assign-staff.ts`
**Reverted:**
- Removed metadata from responses (not needed with polling)

### `/src/components/form/SlotMachineModalStaff.astro`
**Removed:**
- Metadata update call (polling handles this now)

## HTML Attribute Structure

Elements that should auto-refresh need these attributes:

```html
<span 
  data-refresh="true"
  data-project-id="123"
  data-meta="fieldName"
  data-meta-value="currentValue"
>
  Display Value
</span>
```

**How it works:**
1. `data-refresh="true"` - Marks element for scanning
2. `data-project-id="123"` - Links to specific project
3. `data-meta="status"` - Which field to watch
4. `data-meta-value="50"` - Current value for change detection

When the value changes:
- `data-meta-value` is updated
- Element text content is updated
- Blue flash animation plays
- `projectRefreshed` event fires

## Usage Examples

### Adding Auto-Refresh to Any Field

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

### Listening for Updates

```javascript
document.addEventListener('projectRefreshed', (event) => {
  const { projectId, project, updatedCount } = event.detail;
  console.log(`Project ${projectId} updated!`);
});
```

### Manual Control

```javascript
// Stop polling
window.projectRefreshManager.stop();

// Resume polling
window.projectRefreshManager.start();

// Refresh specific project now
await window.projectRefreshManager.refreshProject(123);

// Change interval to 10 seconds
window.projectRefreshManager = new ProjectRefreshManager({ interval: 10000 });
window.projectRefreshManager.start();
```

## Current Auto-Refresh Fields

### ProjectItem.astro
1. **Punchlist Count** - "5 / 10" format
2. **Due Date** - ISO date string

### Ready to Add (just add data attributes):
- Status
- Assigned Staff ID
- Any other project field

## Performance

**Built-in Optimizations:**
- ✅ Only queries visible projects
- ✅ Single batch request for all projects
- ✅ Change detection prevents unnecessary updates
- ✅ Caching reduces redundant processing
- ✅ Console logging for monitoring

**Resource Usage:**
- API call every 5 seconds
- Minimal: If 10 projects visible = 1 query fetching 10 projects
- Database query is efficient (indexed lookups)

**Adjust for Your Needs:**
- High activity: 3-5 second interval
- Normal: 5-10 seconds
- Low activity: 10-30 seconds

## Testing

1. Open dashboard in two browser windows
2. In window 1, update a project's due date
3. Watch window 2 - updates appear within 5 seconds
4. Look for blue flash animation
5. Check console for logs: `📊 [REFRESH] ...`

## Benefits Over Event-Based

| Feature | Event-Based | Polling-Based |
|---------|-------------|---------------|
| Multi-user sync | ❌ Only updates from own actions | ✅ Updates from anyone |
| External changes | ❌ Missed | ✅ Caught automatically |
| Implementation | Complex metadata tracking | Simple polling loop |
| Scalability | Single user | Multiple users |
| Real-time feel | Instant | ~5 second delay |
| Server load | Low (only on actions) | Moderate (regular queries) |

## Migration Notes

**For other pages/components:**
1. Remove any `metadata` handling in API responses
2. Remove any `updateProjectElements()` calls
3. Add data attributes to elements that should refresh
4. The refresh manager is global - it just works!

**Backward Compatibility:**
- Old code without data attributes still works
- No breaking changes to existing functionality
- Polling is additive, doesn't interfere with existing logic

## Troubleshooting

### Updates not appearing?
- Check console for `📊 [REFRESH]` logs
- Verify all 4 data attributes are present
- Confirm field is returned by `/api/projects/refresh`

### Too many API calls?
- Increase interval: `new ProjectRefreshManager({ interval: 10000 })`
- Add visibility detection (pause when tab inactive)

### Wrong values showing?
- Ensure `data-meta-value` format matches API response format
- Check if field needs special handling (like punchlistItems)

## Next Steps

Potential enhancements:
1. Add page visibility detection (pause when inactive)
2. Implement exponential backoff if no changes
3. Add more fields (status, staff, etc.)
4. Add rate limiting to API endpoint
5. Consider WebSocket for truly real-time needs

## Documentation

Full documentation: `/markdowns/polling-refresh-system.md`

## Support

Check console logs for detailed activity:
```javascript
// Enable verbose logging (if added)
window.projectRefreshManager.verbose = true;
```

All refresh activity is logged with `📊 [REFRESH]` prefix for easy filtering.
