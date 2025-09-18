# RefreshManager Usage Guide

The enhanced RefreshManager now supports automatic cycling through pages every 15 seconds to check for database changes and update DOM elements accordingly.

## Basic Usage

### 1. Mark Elements for Auto-Refresh

Add `data-refresh` and context attributes to any DOM element:

```html
<!-- Project context -->
<span data-refresh="status_name" data-project-id="123">In Progress</span>
<input data-refresh="title" data-project-id="123" value="Project Title" />

<!-- User context -->
<span data-refresh="company_name" data-user-id="456">Company Name</span>
<input data-refresh="phone" data-user-id="456" value="555-1234" />

<!-- Global context (no specific ID) -->
<span data-refresh="total_projects">5</span>
```

### 2. Start Auto-Refresh

```javascript
// Start with default 15-second interval
refreshManager.startAutoRefresh();

// Start with custom interval (30 seconds)
refreshManager.startAutoRefreshWithInterval(30);

// Check if auto-refresh is active
if (refreshManager.isAutoRefreshActive()) {
  console.log("Auto-refresh is running");
}
```

### 3. Control Auto-Refresh

```javascript
// Stop auto-refresh
refreshManager.stopAutoRefresh();

// Change interval (will restart if currently active)
refreshManager.setRefreshInterval(10000); // 10 seconds

// Force a manual refresh cycle
await refreshManager.forceRefresh();
```

## How It Works

### 1. Element Grouping

The system groups elements by context:

- **Project context**: `data-project-id="123"` → calls `/api/get-project/123`
- **User context**: `data-user-id="456"` → calls `/api/get-user/456`
- **Global context**: No ID → (not implemented yet)

### 2. Efficient API Calls

Instead of making individual API calls for each element, it:

- Groups elements by context (project/user)
- Makes one API call per context
- Compares database values with current DOM values
- Only updates elements that have changed

### 3. Smart Updates

- Compares current DOM values with database values
- Only updates elements that actually changed
- Uses existing update callbacks for proper formatting
- Handles different element types (input, select, textarea, etc.)

## Example Implementation

### In your Astro component:

```astro
---
// Your component logic
const projectId = "123";
const userId = "456";
---

<div>
  <!-- Project elements -->
  <h1 data-refresh="title" data-project-id={projectId}>{project.title}</h1>
  <span data-refresh="status_name" data-project-id={projectId}>{project.status_name}</span>
  <input data-refresh="address" data-project-id={projectId} value={project.address} />

  <!-- User elements -->
  <span data-refresh="company_name" data-user-id={userId}>{user.company_name}</span>
  <input data-refresh="phone" data-user-id={userId} value={user.phone} />
</div>

<script>
  // Start auto-refresh when page loads
  document.addEventListener("DOMContentLoaded", () => {
    refreshManager.startAutoRefresh();

    // Debug: Log all refreshable elements
    refreshManager.debugRefreshableElements();
  });

  // Stop auto-refresh when leaving page
  window.addEventListener("beforeunload", () => {
    refreshManager.stopAutoRefresh();
  });
</script>
```

### In your JavaScript:

```javascript
// Check refresh statistics
const stats = refreshManager.getRefreshStats();
console.log(
  `Auto-refresh: ${stats.isActive}, Interval: ${stats.intervalMs}ms, Elements: ${stats.elementCount}`
);

// Register custom update callback
refreshManager.registerCallback("custom_field", (value) => {
  const element = this;
  element.innerHTML = `<strong>${value}</strong>`;
  element.classList.add("updated");
});
```

## API Requirements

The auto-refresh system expects these API endpoints:

- `/api/get-project/{id}` - Returns project data with all fields
- `/api/get-user/{id}` - Returns user data with all fields

These APIs should return JSON objects with field names matching the `data-refresh` attribute values.

## Performance Considerations

- **Efficient grouping**: Elements are grouped by context to minimize API calls
- **Change detection**: Only updates elements that have actually changed
- **Configurable interval**: Default 15 seconds, but can be adjusted
- **Error handling**: Gracefully handles API failures and continues operation
- **Memory management**: Properly cleans up intervals when stopped

## Debugging

```javascript
// Log all refreshable elements
refreshManager.debugRefreshableElements();

// Get current statistics
console.log(refreshManager.getRefreshStats());

// Force a refresh cycle
await refreshManager.forceRefresh();
```

## Best Practices

1. **Use specific contexts**: Always include `data-project-id` or `data-user-id` for better performance
2. **Reasonable intervals**: Don't set intervals too low (minimum 5 seconds recommended)
3. **Stop when not needed**: Stop auto-refresh when users navigate away or when not needed
4. **Handle errors gracefully**: The system will log errors but continue operating
5. **Test thoroughly**: Use `forceRefresh()` to test your setup before relying on automatic cycling
