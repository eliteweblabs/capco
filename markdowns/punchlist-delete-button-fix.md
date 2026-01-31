# Punchlist Delete Button Fix

## Issue

Clicking the delete button on a punchlist item does nothing - the button shows the confirmation timer but doesn't actually delete the item when confirmed.

## Root Cause

The `DeleteConfirmButton` component dispatches a `deleteConfirmed` custom event when the user confirms deletion (second click), but there was **no event listener** in `PunchlistDrawer.astro` to:

1. Catch the `deleteConfirmed` event
2. Call the API endpoint to delete the item
3. Update the UI

The `handlePunchlistDelete` callback existed but was never being triggered.

## Solution Implemented

Added an event listener in `PunchlistDrawer.astro` that:

1. **Listens for the `deleteConfirmed` event** from any DeleteConfirmButton
2. **Filters for punchlist delete buttons** (IDs starting with `delete-punchlist-`)
3. **Extracts the punchlist item ID** from the button ID
4. **Calls the API** to delete the item from the database
5. **Updates the UI** by calling the existing `handlePunchlistDelete` callback

### Code Added (lines 625-668 in PunchlistDrawer.astro)

```javascript
// Listen for deleteConfirmed events from DeleteConfirmButton components
document.addEventListener("deleteConfirmed", async (e) => {
  const buttonId = e.detail?.buttonId;

  if (!buttonId || !buttonId.startsWith("delete-punchlist-")) {
    return; // Not a punchlist delete button
  }

  console.log("🔔 [PUNCHLIST] Delete confirmed for button:", buttonId);

  // Extract punchlist ID from button ID (format: delete-punchlist-{id})
  const punchlistId = parseInt(buttonId.replace("delete-punchlist-", ""));

  if (!punchlistId || isNaN(punchlistId)) {
    console.error("❌ [PUNCHLIST] Invalid punchlist ID:", buttonId);
    return;
  }

  console.log("🔔 [PUNCHLIST] Deleting punchlist item:", punchlistId);

  try {
    // Call the API to delete the item
    const response = await fetch("/api/punchlist/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        itemId: punchlistId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ [PUNCHLIST] Item deleted successfully");
      // Call the callback to update UI
      await window.handlePunchlistDelete(punchlistId);
    } else {
      console.error("❌ [PUNCHLIST] Failed to delete item:", data.error);
      if (window.showNotice) {
        window.showNotice(
          "error",
          "Delete Failed",
          data.error || "Failed to delete punchlist item"
        );
      }
    }
  } catch (error) {
    console.error("❌ [PUNCHLIST] Error deleting item:", error);
    if (window.showNotice) {
      window.showNotice("error", "Delete Failed", "An error occurred while deleting the item");
    }
  }
});
```

## How It Works

### DeleteConfirmButton Flow

1. **First click**: Shows timer ring for 3 seconds, changes icon to stopwatch
2. **Second click** (within 3 seconds): Dispatches `deleteConfirmed` custom event
3. Event bubbles up with `detail: { buttonId }`

### PunchlistDrawer Integration

1. **Event listener** catches the `deleteConfirmed` event
2. **Validates** the button ID matches punchlist pattern
3. **Extracts** item ID from button ID (`delete-punchlist-202` → `202`)
4. **API call** to `/api/punchlist/delete` with `{ itemId: 202 }`
5. **On success**: Calls `handlePunchlistDelete(202)` which:
   - Removes item from local array
   - Re-renders the list
   - Updates incomplete count
   - Shows success message

### API Endpoint

- **Path**: `/api/punchlist/delete`
- **Method**: POST
- **Body**: `{ itemId: number }`
- **Permissions**: Admin/Staff only
- **Response**: `{ success: true, message: "..." }`

## Testing

### Test Manually

1. Log in as Admin
2. Navigate to a project with punchlist items
3. Open punchlist drawer (click menu-check icon)
4. Click delete (trash) icon on any item
   - ✅ Should show timer ring with stopwatch icon
5. Click again within 3 seconds
   - ✅ Should delete the item
   - ✅ Item should disappear from list
   - ✅ Success message should appear
   - ✅ Incomplete count should update

### Check Console Logs

Look for these messages:

- `🔔 [PUNCHLIST] Delete confirmed for button: delete-punchlist-{id}`
- `🔔 [PUNCHLIST] Deleting punchlist item: {id}`
- `✅ [PUNCHLIST] Item deleted successfully`
- `✅ [PUNCHLIST] Punchlist completion status updated successfully` (if applicable)

### Error Handling

If delete fails, should show:

- ❌ Error message notification
- Console error with details
- List should not change

## Files Modified

- `/src/components/project/PunchlistDrawer.astro` - Added event listener for deleteConfirmed

## Related Components

- `/src/components/common/DeleteConfirmButton.astro` - Dispatches the event
- `/src/components/common/PunchlistItem.astro` - Uses DeleteConfirmButton
- `/src/pages/api/punchlist/delete.ts` - API endpoint
- `/src/pages/partials/punchlist-item.astro` - Partial wrapper

## Why This Was Missing

The delete functionality was partially implemented:

- ✅ DeleteConfirmButton component worked correctly
- ✅ API endpoint existed
- ✅ UI update callback existed
- ❌ **Missing link**: No event listener to connect the button to the API and callback

The event listener is the "glue" that connects all the pieces together.

## Prevention

For future similar components:

1. ✅ Component dispatches custom event
2. ✅ Parent component listens for event
3. ✅ API endpoint exists
4. ✅ UI update logic exists
5. ✅ **Connect all pieces with event listener**

## Commit Message

```
fix: connect punchlist delete button to API and callback

Add event listener in PunchlistDrawer to catch deleteConfirmed events
from DeleteConfirmButton, call API endpoint, and update UI.

Previously the button showed confirmation but didn't actually delete.
```
