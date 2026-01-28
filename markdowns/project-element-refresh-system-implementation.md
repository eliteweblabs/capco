# Project Element Refresh System - Implementation Summary

## Overview

Successfully implemented a system to refresh page elements without requiring a full page reload when project data is updated. This system allows any element on the page with `data-project-id` attributes to automatically update when project data changes through the API.

## Implementation Details

### 1. Backend Changes

#### `/src/pages/api/projects/upsert.ts`

**POST endpoint** (Create):
- Added `metadata` object to response containing:
  - `projectId`: The ID of the created project
  - `updatedAt`: Timestamp of creation
  - `changedFields`: Empty object for new projects

**PUT endpoint** (Update):
- Added change detection logic to compare old and new project data
- Added `metadata` object to response containing:
  - `projectId`: The ID of the updated project
  - `updatedAt`: Current timestamp
  - `changedFields`: Object with only the fields that changed

#### `/src/pages/api/utils/assign-staff.ts`

- Added `metadata` object to response containing:
  - `projectId`: The project being assigned
  - `updatedAt`: Current timestamp
  - `changedFields`: Object with `assignedToId` field

### 2. Frontend Changes

#### `/src/components/project/ProjectItem.astro`

**Data Attributes Added to `<tr>` element:**
```html
<tr
  data-project-id={project.id}
  data-updated={project.updatedAt}
  data-assigned-to-id={project.assignedToId || ""}
  data-due-date={project.dueDate || ""}
  data-status={project.status}
>
```

**Global `updateProjectElements()` Function:**
- Finds all elements with matching `data-project-id`
- Updates `data-updated` attribute with current timestamp
- Updates data attributes for each changed field (converts camelCase to kebab-case)
- Updates child elements with `data-field` attributes
- Dispatches `projectUpdated` custom event for component-specific handlers

**Updated `adjustDueDate()` Function:**
- Now calls `updateProjectElements()` after successful API update
- Automatically updates all project elements without manual DOM manipulation

#### `/src/components/form/SlotMachineModalStaff.astro`

**Updated `saveToAPI()` Function:**
- After successful API call, checks for `result.metadata`
- Calls `window.updateProjectElements()` if metadata is present
- Works alongside existing `updateCallback` mechanism

### 3. Documentation

Created comprehensive documentation files:

#### `/markdowns/project-element-refresh-system.md`
- System overview and how it works
- Backend API response structure
- Frontend HTML structure patterns
- Usage examples and best practices
- Benefits and future enhancements

#### `/scripts/project-refresh-examples.js`
- 7 practical code examples:
  1. Update single project field
  2. Update multiple fields at once
  3. Listen for project update events
  4. Create HTML with auto-update support
  5. Batch update multiple projects
  6. Update with optimistic UI
  7. Component-specific update handler

## How to Use

### Basic Usage

```javascript
// Update a project field
const response = await fetch("/api/projects/upsert", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: projectId,
    dueDate: newDate,
  }),
});

const result = await response.json();

// Automatically update all elements
if (result.metadata && window.updateProjectElements) {
  window.updateProjectElements(result.metadata);
}
```

### HTML Structure

```html
<!-- Parent container with project ID -->
<div data-project-id="123" data-updated="2026-01-27T10:00:00.000Z">
  
  <!-- Elements with data-field will auto-update -->
  <p>Status: <span data-field="status">Pending</span></p>
  <p>Due: <span data-field="dueDate">Jan 28</span></p>
  
</div>
```

### Custom Event Handling

```javascript
document.addEventListener('projectUpdated', (event) => {
  const { projectId, changedFields, updatedAt } = event.detail;
  
  // Custom handling for specific fields
  if (changedFields.status !== undefined) {
    updateCustomStatusDisplay(projectId, changedFields.status);
  }
});
```

## Field Name Conversion

The system automatically converts camelCase field names to kebab-case data attributes:

- `dueDate` → `data-due-date`
- `assignedToId` → `data-assigned-to-id`
- `status` → `data-status`
- `newConstruction` → `data-new-construction`

## Benefits

1. **No Full Page Reload**: Elements update instantly
2. **Consistent Data**: All instances of project data update simultaneously
3. **Extensible**: Easy to add new fields or custom handlers
4. **Event-Driven**: Components can listen and react to updates
5. **Automatic**: No manual DOM manipulation needed for basic updates

## Current Integrations

The system is currently integrated with:

1. **Due Date Adjustments** (`ProjectItem.astro`)
   - +/- buttons to adjust due date
   - Automatically updates all due date displays

2. **Staff Assignments** (`SlotMachineModalStaff.astro`)
   - Slot machine modal for assigning staff
   - Updates staff icons and assignments across the page

## Future Enhancements

Potential improvements to consider:

1. Add debouncing for rapid updates
2. Implement optimistic UI updates (pre-example available)
3. Add animation/transitions for field changes
4. Support for nested project data structures
5. Batch updates for multiple projects
6. Real-time updates via WebSocket for multi-user scenarios

## Testing

To test the system:

1. Navigate to the project dashboard
2. Adjust a project's due date using the +/- buttons
3. Observe that the "Updated" column immediately reflects the change
4. Assign a staff member to a project
5. Observe that the staff icon updates without page reload
6. Open browser console to see detailed logging of updates

## Files Modified

- `/src/pages/api/projects/upsert.ts` (Backend API)
- `/src/pages/api/utils/assign-staff.ts` (Backend API)
- `/src/components/project/ProjectItem.astro` (Frontend component)
- `/src/components/form/SlotMachineModalStaff.astro` (Frontend component)

## Files Created

- `/markdowns/project-element-refresh-system.md` (Documentation)
- `/scripts/project-refresh-examples.js` (Code examples)
- `/markdowns/project-element-refresh-system-implementation.md` (This file)

## Notes

- The system is backward compatible - it won't break existing functionality
- All console logging is included for debugging and can be removed in production
- The `updateProjectElements()` function is globally available on `window` object
- TypeScript type safety maintained throughout implementation
