# Project Element Refresh System

## Overview

This system allows page elements to be updated in real-time without requiring a full page refresh when project data changes. It works by using data attributes and a global update function.

## How It Works

### 1. Backend (API)

When a project is updated via the `PUT /api/projects/upsert` endpoint, the response includes:

```json
{
  "success": true,
  "project": { /* full project data */ },
  "metadata": {
    "projectId": 123,
    "updatedAt": "2026-01-27T10:30:00.000Z",
    "changedFields": {
      "dueDate": "2026-01-28T12:00:00.000Z",
      "status": 50,
      "assignedToId": "uuid-here"
    }
  }
}
```

### 2. Frontend (HTML Structure)

Any element that displays project data should include these data attributes:

```html
<!-- Example: Project row -->
<tr data-project-id="123">
  <!-- Your content here -->
</tr>

<!-- Example: Project card -->
<div 
  data-project-id="123"
  data-updated="2026-01-27T10:30:00.000Z"
  data-status="50"
  data-due-date="2026-01-28T12:00:00.000Z"
>
  <span data-field="status">In Progress</span>
  <span data-field="dueDate">Jan 28, 2026</span>
</div>
```

### 3. Client-Side Update Function

The global `updateProjectElements()` function automatically:

1. Finds all elements with matching `data-project-id`
2. Updates the `data-updated` attribute with current timestamp
3. Updates each changed field as a data attribute (e.g., `data-due-date`, `data-status`)
4. Updates any child elements with `data-field` attributes
5. Dispatches a `projectUpdated` custom event

## Usage

### Basic Example

```javascript
// After a successful API call
const response = await fetch("/api/projects/upsert", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: projectId,
    dueDate: newDate,
  }),
});

const result = await response.json();

// Update all project elements automatically
if (result.metadata) {
  updateProjectElements(result.metadata);
}
```

### HTML Structure for Auto-Updates

```html
<!-- Parent container with project ID -->
<div data-project-id="123" data-updated="2026-01-27T10:00:00.000Z">
  
  <!-- Elements with data-field will auto-update -->
  <p>Status: <span data-field="status">Pending</span></p>
  <p>Due: <span data-field="dueDate">Jan 28</span></p>
  
  <!-- Data attributes also updated -->
  <div data-status="0" data-due-date="2026-01-28T12:00:00.000Z"></div>
  
</div>
```

### Listening for Update Events

```javascript
// Listen for project updates
document.addEventListener('projectUpdated', (event) => {
  const { projectId, changedFields, updatedAt } = event.detail;
  
  console.log(`Project ${projectId} updated at ${updatedAt}`);
  console.log('Changed fields:', changedFields);
  
  // Custom handling for specific fields
  if (changedFields.status !== undefined) {
    // Handle status change
    updateStatusIndicator(projectId, changedFields.status);
  }
  
  if (changedFields.assignedToId !== undefined) {
    // Handle assignment change
    updateStaffIcon(projectId, changedFields.assignedToId);
  }
});
```

## Data Attribute Naming Convention

Field names are converted from camelCase to kebab-case:

- `dueDate` → `data-due-date`
- `assignedToId` → `data-assigned-to-id`
- `status` → `data-status`
- `newConstruction` → `data-new-construction`

## Complete Example: Update Due Date

```javascript
async function updateProjectDueDate(projectId, newDate) {
  try {
    const response = await fetch("/api/projects/upsert", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: projectId,
        dueDate: newDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update due date");
    }

    const result = await response.json();
    
    // Automatically updates all elements with data-project-id="projectId"
    if (result.metadata) {
      updateProjectElements(result.metadata);
    }

    // Show success notification
    showNotice("success", "Updated", "Due date updated successfully");
    
  } catch (error) {
    console.error("Error:", error);
    showNotice("error", "Failed", "Could not update due date");
  }
}
```

## Benefits

1. **No Full Page Reload**: Elements update instantly without refreshing
2. **Consistent Data**: All instances of project data update simultaneously
3. **Extensible**: Easy to add new fields or custom handlers
4. **Event-Driven**: Components can listen for updates and react accordingly
5. **Automatic**: No manual DOM manipulation needed for basic updates

## Implementation Files

- **Backend**: `/src/pages/api/projects/upsert.ts`
- **Frontend**: `/src/components/project/ProjectItem.astro`
- **Usage**: Used in `adjustDueDate()`, can be used anywhere projects are updated

## Future Enhancements

- Add debouncing for rapid updates
- Implement optimistic UI updates
- Add animation/transitions for field changes
- Support for nested project data structures
- Batch updates for multiple projects
