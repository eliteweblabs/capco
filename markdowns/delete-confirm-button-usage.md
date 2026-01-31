# DeleteConfirmButton - Self-Contained Component

## Overview
`DeleteConfirmButton` is a fully self-contained, reusable delete button component that requires **zero additional code** in parent components. Just drop it in with the right props and it handles everything.

## Key Features
- ✅ **Zero setup required** - No event listeners needed in parent
- ✅ **Automatic API calls** - Handles API requests internally
- ✅ **Callback support** - Calls global callbacks after successful deletion
- ✅ **Smart ID extraction** - Automatically extracts item ID from button ID
- ✅ **Error handling** - Shows user-friendly error messages
- ✅ **Loading states** - Disables button during deletion
- ✅ **Two-step confirmation** - Timer ring prevents accidental deletions

## Basic Usage

### Minimal Example
```astro
<DeleteConfirmButton
  id="delete-item-123"
/>
```

### Full Example with API
```astro
<DeleteConfirmButton
  id="delete-punchlist-202"
  itemType="punchlist"
  apiEndpoint="/api/punchlist/delete"
  onDeleteCallback="handlePunchlistDelete"
  size="xs"
  tooltipText="Delete punchlist item"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **Required** | Button ID, should contain item ID (e.g., `delete-punchlist-202`) |
| `apiEndpoint` | `string` | - | API endpoint to call for deletion (e.g., `/api/punchlist/delete`) |
| `onDeleteCallback` | `string` | - | Global function name to call after successful deletion |
| `itemType` | `string` | - | Type of item (helps with ID extraction and messaging) |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl"` | `"sm"` | Button size |
| `variant` | `"icon" \| "button"` | `"icon"` | Display as icon-only or button with label |
| `label` | `string` | `"Delete"` | Button label (for button variant) |
| `tooltipText` | `string` | `"Delete"` | Tooltip text |
| `timeout` | `number` | `3000` | Confirmation timeout in milliseconds |
| `class` | `string` | `""` | Additional CSS classes |

## How It Works

### 1. User Interaction
```
First Click  → Shows timer ring (3s default)
Second Click → Executes deletion
No Second Click → Auto-reverts to trash icon
```

### 2. Internal Process (Automatic)
```
1. Extract item ID from button ID
2. Call API endpoint (if provided)
3. On success:
   - Call global callback (if provided)
   - Show success notification
4. On error:
   - Show error notification
   - Re-enable button
```

### 3. ID Extraction Patterns
The component automatically tries these patterns:

| Button ID Pattern | Extracted ID | Notes |
|-------------------|--------------|-------|
| `delete-punchlist-202` | `202` | With itemType="punchlist" |
| `delete-item-456` | `456` | Any format with trailing number |
| `custom-789` | `789` | Falls back to last number in ID |

## API Integration

### Expected Request
```javascript
POST /api/your-endpoint
{
  "itemId": 123,  // Primary field
  "id": 123       // Fallback field
}
```

### Expected Response
```javascript
// Success
{
  "success": true,
  "message": "Item deleted"
}

// Error
{
  "success": false,
  "error": "Permission denied"
}
```

## Callback Integration

### Define Global Callback
```javascript
window.handlePunchlistDelete = async (itemId) => {
  // Update local state
  items = items.filter(item => item.id !== itemId);
  
  // Re-render UI
  await renderItems();
  
  // Show notification
  if (window.showSuccess) {
    window.showSuccess("Deleted", "Item removed successfully");
  }
};
```

### Use in Component
```astro
<DeleteConfirmButton
  id={`delete-punchlist-${item.id}`}
  apiEndpoint="/api/punchlist/delete"
  onDeleteCallback="handlePunchlistDelete"
/>
```

**Flow:**
1. Button calls API → `/api/punchlist/delete`
2. On success → Calls `window.handlePunchlistDelete(itemId)`
3. Callback updates UI

## Real-World Examples

### Punchlist Item Delete
```astro
<DeleteConfirmButton
  id={`delete-punchlist-${comment.id}`}
  itemType="punchlist"
  apiEndpoint="/api/punchlist/delete"
  onDeleteCallback="handlePunchlistDelete"
  size="xs"
  tooltipText="Delete punchlist item"
/>
```

### File Delete
```astro
<DeleteConfirmButton
  id={`delete-file-${file.id}`}
  itemType="file"
  apiEndpoint="/api/files/delete"
  onDeleteCallback="handleFileDelete"
  size="sm"
  tooltipText="Delete file"
/>
```

### Project Delete (with confirmation)
```astro
<DeleteConfirmButton
  id={`delete-project-${project.id}`}
  itemType="project"
  apiEndpoint="/api/projects/delete"
  onDeleteCallback="handleProjectDelete"
  size="md"
  variant="button"
  label="Delete Project"
  timeout={5000}
/>
```

### Simple Delete (No API)
```astro
<!-- Just calls callback, no API call -->
<DeleteConfirmButton
  id={`delete-temp-${index}`}
  onDeleteCallback="handleTempDelete"
/>
```

## Styling

### Default Styles
- Icon variant: Ghost button with trash icon
- Timer ring: Red circular progress indicator
- Stopwatch icon: Shows during confirmation period
- Disabled state: 50% opacity, not-allowed cursor

### Custom Styling
```astro
<DeleteConfirmButton
  id="delete-item-123"
  class="my-custom-class hover:bg-red-500"
/>
```

## Notifications

The component uses global notification functions:

### Success
```javascript
window.showSuccess(title, message, duration);
```

### Error
```javascript
window.showNotice(type, title, message, duration);
```

### Fallback
If these functions don't exist, the component still works but without notifications.

## Advanced Features

### Multiple Buttons on Same Page
✅ Each button is independent
✅ No conflicts or shared state
✅ Each has its own timeout

### Dynamic Lists
✅ Works in rendered lists (v-for, map, etc.)
✅ Handles Astro partials and HTMX swaps
✅ Automatically initializes on page transitions

### Error Recovery
✅ Re-enables button on API failure
✅ Shows user-friendly error messages
✅ Preserves UI state on error

## Troubleshooting

### Button does nothing on second click

**Check:**
1. Is `apiEndpoint` provided?
2. Is the API returning `{ success: true }`?
3. Check browser console for errors
4. Verify button ID contains a valid number

### Callback not called

**Check:**
1. Is callback function defined globally on `window`?
2. Is the callback name spelled correctly?
3. Is API call successful? (callback only runs on success)

### Wrong item ID extracted

**Solution:**
- Use format: `delete-{itemType}-{id}`
- Or provide explicit `itemType` prop
- Check button ID in console logs

### Button stays disabled

**Cause:** API call didn't complete (network error, timeout)

**Solution:**
- Check network tab for failed requests
- Verify API endpoint is correct
- Check for CORS issues

## Migration Guide

### From Event-Based Approach

**Before (required event listener in parent):**
```javascript
// Parent component
document.addEventListener("deleteConfirmed", async (e) => {
  const itemId = extractId(e.detail.buttonId);
  await fetch("/api/delete", { 
    method: "POST", 
    body: JSON.stringify({ itemId }) 
  });
  updateUI(itemId);
});
```

**After (zero code in parent):**
```astro
<DeleteConfirmButton
  id="delete-item-123"
  apiEndpoint="/api/delete"
  onDeleteCallback="updateUI"
/>
```

### Benefits
- ✅ No boilerplate code in parent
- ✅ Consistent behavior across app
- ✅ Easy to test and maintain
- ✅ Drop-in anywhere

## Best Practices

1. **Always include item ID in button ID**
   ```astro
   id={`delete-${itemType}-${item.id}`}
   ```

2. **Use descriptive itemType**
   ```astro
   itemType="punchlist"  // Good
   itemType="item"       // Too generic
   ```

3. **Provide meaningful tooltips**
   ```astro
   tooltipText="Delete punchlist item"  // Good
   tooltipText="Delete"                 // Generic
   ```

4. **Match timeout to importance**
   ```astro
   timeout={1000}  // Quick deletes (temp items)
   timeout={3000}  // Default (most items)
   timeout={5000}  // Important items (projects, users)
   ```

5. **Handle errors gracefully in callbacks**
   ```javascript
   window.handleDelete = async (itemId) => {
     try {
       await updateUI(itemId);
     } catch (error) {
       await reloadData(); // Fallback
     }
   };
   ```

## Files
- `/src/components/common/DeleteConfirmButton.astro` - Main component
- `/src/components/common/Button.astro` - Base button component
- `/src/components/common/SimpleIcon.astro` - Icon component (used by Button)
