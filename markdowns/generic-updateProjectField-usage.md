# Generic `updateProjectField` Function

## Overview
A reusable function for updating any project field with automatic debouncing, visual feedback, and polling protection.

## Requirements
Any element needs these data attributes:
- `data-project-id` - The project ID
- `data-meta` - The database column name (e.g., "dueDate", "punchlistComplete", "status")
- `data-meta-value` - The current value
- `data-refresh="true"` - Enable refresh system

## Function Signature
```typescript
async function updateProjectField(
  element: HTMLElement,      // The element with data attributes
  newValue: any,              // The new value to save
  formatDisplay?: (value: any) => string  // Optional display formatter
)
```

## Usage Examples

### 1. Number Input (Punchlist)
```astro
<input
  type="number"
  value={project.punchlistComplete || 0}
  data-refresh="true"
  data-project-id={project.id}
  data-meta="punchlistComplete"
  data-meta-value={project.punchlistComplete || 0}
  onchange="updateProjectField(this, parseInt(this.value))"
  class="relative w-12 text-center border rounded p-1"
  min="0"
/>
```

### 2. Date Input (Due Date with Formatter)
```javascript
adjustDueDate(projectId, hours) {
  const input = document.getElementById(`due-date-${projectId}`);
  const date = new Date(input.getAttribute("data-due-date"));
  date.setHours(date.getHours() + hours);
  
  // Use formatter for display
  updateProjectField(
    input,
    date.toISOString(),
    (value) => new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    })
  );
}
```

### 3. Text Input (No Formatter)
```astro
<input
  type="text"
  value={project.title}
  data-refresh="true"
  data-project-id={project.id}
  data-meta="title"
  data-meta-value={project.title}
  onchange="updateProjectField(this, this.value)"
  class="relative border rounded p-2"
/>
```

### 4. Select Dropdown
```astro
<select
  data-refresh="true"
  data-project-id={project.id}
  data-meta="status"
  data-meta-value={project.status}
  onchange="updateProjectField(this, parseInt(this.value))"
  class="relative border rounded p-2"
>
  <option value="0">Pending</option>
  <option value="110">In Progress</option>
  <option value="220">Complete</option>
</select>
```

## Visual Feedback States

### 1. Saving (Gray Pulsing Disk)
```css
[data-refresh="true"].saving::after {
  background-image: url("...disk-icon...");
  opacity: 1;
  animation: pulse 1s infinite;
}
```

### 2. Saved (Green Checkmark)
```css
[data-refresh="true"].saved::after {
  background-image: url("...checkmark-icon...");
  opacity: 1;
}
```

### 3. Error (Red X)
```css
[data-refresh="true"].save-error::after {
  background-image: url("...x-icon...");
  opacity: 1;
}
```

## Behavior

1. **Immediate Feedback**: `.saving` class added instantly
2. **Debounced Save**: Waits 500ms after last change
3. **Polling Protection**: Refresh system won't overwrite during edit
4. **Success Animation**: Disk → Checkmark → Fade (3s)
5. **Error Handling**: Red X + toast notification
6. **Auto Refresh**: Triggers immediate project refresh after save

## Features

✅ **Automatic debouncing** - Multiple rapid changes batched into one save  
✅ **Per-field tracking** - Each field has independent save timer  
✅ **Dynamic column names** - Works with any database column  
✅ **Type flexibility** - Handles strings, numbers, dates, etc.  
✅ **Visual feedback** - Icons show save state  
✅ **Error recovery** - Shows errors without breaking UI  
✅ **Polling safe** - Blocks background refresh during edit  

## CSS Requirements

Element must have `position: relative` for the `::after` icon to position correctly:

```astro
<input
  class="relative ..."  <!-- REQUIRED -->
  data-refresh="true"
  ...
/>
```

## Error Messages

- **Missing data-project-id or data-meta**: Console error, no save attempt
- **Network failure**: Red X icon + toast notification
- **Server error**: Red X icon + toast notification

## Extending

To add custom formatting for a new field type:

```javascript
// Example: Format currency
updateProjectField(
  element,
  5000,
  (value) => `$${value.toLocaleString()}`
);

// Example: Format percentage
updateProjectField(
  element,
  0.75,
  (value) => `${(value * 100).toFixed(1)}%`
);
```

---

**Date**: January 27, 2026  
**Status**: Production Ready
