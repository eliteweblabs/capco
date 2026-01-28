# Refresh Manager Debug Guide

## Check if Refresh Manager is Running

Open browser console on the dashboard and run:

```javascript
// Check if refresh manager exists
console.log("RefreshManager exists?", !!window.refreshManager);

// Check if it's running
console.log("Is active?", window.refreshManager?.isAutoRefreshActive());

// Get stats
console.log("Stats:", window.refreshManager?.getRefreshStats());

// Get all elements being tracked
console.log("Refreshable elements:", window.refreshManager?.getRefreshableElements().length);
window.refreshManager?.debugRefreshableElements();
```

## Expected Console Output

When the page loads, you should see:

```
✅ [GLOBAL] Project item handlers loaded
🔄 [DASHBOARD] Starting refresh manager...
🔄 [DASHBOARD] DOM loaded, initializing refresh manager
🔄 [REFRESH-MANAGER] Starting auto-refresh cycle every 5 seconds
🔄 [DASHBOARD] Refresh manager started: { isActive: true, intervalMs: 5000, elementCount: X }
```

Then every 5 seconds:

```
🔄 [REFRESH-MANAGER] Starting refresh cycle...
🔄 [REFRESH-MANAGER] Found X refreshable elements to check
🔄 [REFRESH-MANAGER] Refreshing project:123 with 5 field types
🔄 [REFRESH-MANAGER] Refresh cycle completed
```

## If Not Seeing Logs

1. **Hard refresh** (Cmd+Shift+R) to clear cache
2. **Check if it was stopped**: Run `window.refreshManager?.isAutoRefreshActive()`
3. **Manually start it**:
   ```javascript
   window.refreshManager.startAutoRefreshWithInterval(5);
   ```

## If Seeing "No refreshable elements found"

This means no elements have `data-refresh` attributes. Check:

```javascript
// Find all elements with data-refresh
document.querySelectorAll('[data-refresh]').length;

// See what they are
document.querySelectorAll('[data-refresh]');
```

## Force a Refresh Cycle Manually

```javascript
await window.refreshManager.forceRefresh();
```

## Change Polling Interval

```javascript
// 10 seconds
window.refreshManager.setRefreshInterval(10000);

// 30 seconds
window.refreshManager.setRefreshInterval(30000);
```

## Stop Polling

```javascript
window.refreshManager.stopAutoRefresh();
```

## Common Issues

### 1. Script not loading
- Check browser console for errors
- Look for "✅ [GLOBAL] Project item handlers loaded"
- Look for "🔄 [DASHBOARD] Starting refresh manager..."

### 2. No elements with data-refresh
- The dashboard might not have any editable fields
- Check if elements have both `data-refresh="fieldName"` and `data-project-id="123"`

### 3. API errors
- Check Network tab for failed requests to `/api/projects/get?id=X`
- Check console for "🔄 [REFRESH-MANAGER] Error refreshing..."

---

**Quick Test**:
```javascript
// Full diagnostic
console.log("=== REFRESH MANAGER DIAGNOSTIC ===");
console.log("1. Exists?", !!window.refreshManager);
console.log("2. Active?", window.refreshManager?.isAutoRefreshActive());
console.log("3. Stats:", window.refreshManager?.getRefreshStats());
console.log("4. Elements:", document.querySelectorAll('[data-refresh]').length);
console.log("===================================");
```
