# Debug: Two API Calls Instead of One

## Issue

User reports seeing TWO `/api/projects/upsert` calls when clicking the +/- button, even though debouncing should prevent this.

## Debug Logging Added

Added comprehensive logging to `window.adjustDueDate()`:

```javascript
console.log(`🎯 [ADJUST] adjustDueDate called: projectId=${projectId}, hours=${hours}`);
// ... when timeout cleared
console.log(`⏱️  [ADJUST] Clearing existing timeout for ${timeoutKey}`);
// ... when new timeout set
console.log(`⏱️  [ADJUST] Setting new timeout for ${timeoutKey} (500ms)`);
// ... when save executes
console.log(`💾 [SAVE] Saving ${metaName} for project ${projectId} after debounce`);
// ... on success
console.log(`✅ [SAVE] Successfully saved ${metaName} for project ${projectId}`);
```

## How to Debug

1. **Hard refresh** (Cmd+Shift+R)
2. **Open Console** (Cmd+Option+J)
3. **Click +/- button ONCE**
4. Check console logs:

### Expected (Good):
```
🎯 [ADJUST] adjustDueDate called: projectId=123, hours=1
⏱️  [ADJUST] Setting new timeout for fieldTimeout_123_dueDate (500ms)
[500ms passes]
💾 [SAVE] Saving dueDate for project 123 after debounce
[fetch call to /api/projects/upsert]
✅ [SAVE] Successfully saved dueDate for project 123
```

### If Bug (Two Calls):
```
🎯 [ADJUST] adjustDueDate called: projectId=123, hours=1
⏱️  [ADJUST] Setting new timeout for fieldTimeout_123_dueDate (500ms)
🎯 [ADJUST] adjustDueDate called: projectId=123, hours=1  ← CALLED TWICE!
⏱️  [ADJUST] Clearing existing timeout for fieldTimeout_123_dueDate
⏱️  [ADJUST] Setting new timeout for fieldTimeout_123_dueDate (500ms)
[500ms passes]
💾 [SAVE] Saving dueDate for project 123 after debounce
💾 [SAVE] Saving dueDate for project 123 after debounce  ← TWO SAVES!
```

## Possible Causes

1. **Button clicked twice** - User double-clicking
2. **Event bubbling** - Click event triggering twice
3. **Duplicate buttons** - Two buttons with same onclick
4. **Script loaded twice** - Global function defined multiple times
5. **Race condition** - Old timeout not clearing properly

## Next Steps

After rebuild (14:07:16):
1. Clear cache and reload
2. Open console
3. Click +/- button ONCE
4. Share console logs to diagnose which scenario is happening

## Files Modified

- `/src/scripts/project-item-handlers.ts` - Added debug logging to `window.adjustDueDate()`
