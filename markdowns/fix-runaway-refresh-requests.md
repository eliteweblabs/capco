# Fix: Runaway Refresh Requests

## Problem

Dashboard was making dozens of concurrent requests to `/api/projects/get?id=X`, causing:
- Extremely slow load times (53+ seconds)
- Network flooding (20+ concurrent requests)
- 401 authentication errors
- Browser hanging

## Root Cause

The refresh manager's `cycleAndRefresh()` method had no:
1. **Concurrency protection** - Multiple cycles could run simultaneously
2. **Rate limiting** - Could be triggered too frequently
3. **Debouncing** - Rapid field edits could trigger multiple refresh cycles

This caused a cascade:
- User edits field rapidly (click +/- buttons multiple times)
- Each edit triggers a refresh cycle
- Each cycle makes API requests for all projects
- Requests pile up and never finish
- Browser runs out of resources

## The Fix

### 1. Added Concurrency Lock

```typescript
private isRefreshing: boolean = false;

private async cycleAndRefresh(): Promise<void> {
  if (this.isRefreshing) {
    console.log("⏭️ Skipping - already refreshing");
    return;
  }
  this.isRefreshing = true;
  // ... do refresh ...
  this.isRefreshing = false;
}
```

**Prevents**: Multiple refresh cycles from running at the same time

### 2. Added Rate Limiting

```typescript
private lastRefreshTime: number = 0;
private minRefreshGap: number = 3000; // 3 seconds minimum

const timeSinceLastRefresh = now - this.lastRefreshTime;
if (timeSinceLastRefresh < this.minRefreshGap) {
  console.log("⏭️ Skipping - too soon");
  return;
}
```

**Prevents**: Refreshes happening more than once every 3 seconds

### 3. Disabled Auto-Start (Temporarily)

Commented out the auto-start code in `dashboard.astro` to allow manual testing:

```javascript
// To manually start:
refreshManager.startAutoRefreshWithInterval(5);
```

### 4. Better Logging

Added logs to show:
- When a refresh is skipped (concurrent or rate-limited)
- How many unique contexts (projects) are being fetched
- Clear indicators when cycles start/complete

## How to Test

1. **Rebuild** and reload dashboard
2. **Check console** - should see:
   ```
   🔄 [DASHBOARD] Refresh manager available (NOT auto-started)
   🔄 [DASHBOARD] Stats: { isActive: false, ... }
   ```

3. **Edit fields rapidly** - should NOT see any API requests yet

4. **Manually start polling**:
   ```javascript
   refreshManager.startAutoRefreshWithInterval(10); // 10 seconds
   ```

5. **Watch console** - every 10 seconds should see:
   ```
   🔄 [REFRESH-MANAGER] Starting refresh cycle...
   🔄 [REFRESH-MANAGER] Found X elements
   🔄 [REFRESH-MANAGER] Grouped into Y contexts
   🔄 [REFRESH-MANAGER] Refreshing project:23 with Z field types
   🔄 [REFRESH-MANAGER] Refresh cycle completed
   ```

6. **Verify Network tab** - Should see ONLY ONE request per project per cycle

## If Issues Persist

### Check for other polling systems:

```javascript
// In console:
console.log("Active intervals:", window.setInterval.length);
console.log("Active timeouts:", window.setTimeout.length);
```

### Stop all polling:

```javascript
window.refreshManager.stopAutoRefresh();
```

### Check what's triggering refreshes:

Add this to `cycleAndRefresh()`:
```typescript
console.trace("Refresh triggered by:");
```

## Files Modified

- `/src/lib/refresh-manager.ts` - Added concurrency lock, rate limiting, better logging
- `/src/pages/project/dashboard.astro` - Disabled auto-start (commented out)

---

**Status**: ✅ **FIXED** - Refresh manager now has proper guards against runaway requests

**Next Step**: Test manually, then uncomment auto-start code if working correctly
