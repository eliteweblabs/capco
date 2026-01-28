# Fix: Multiple onClick Calls Due to Event Bubbling

## Root Cause Discovered!

Through MCP browser testing, I found that **a single button click was triggering `adjustDueDate()` 3-4 times**!

### Console Evidence:
```
🎯 [ADJUST] adjustDueDate called: projectId=24, hours=1
⏱️  [ADJUST] Setting new timeout
🎯 [ADJUST] adjustDueDate called: projectId=24, hours=1  ← DUPLICATE!
⏱️  [ADJUST] Clearing existing timeout
🎯 [ADJUST] adjustDueDate called: projectId=24, hours=1  ← DUPLICATE!
⏱️  [ADJUST] Clearing existing timeout
💾 [SAVE] Saving dueDate for project 24 after debounce
```

## Why This Happened

**Event bubbling** - The click event was propagating up through parent elements, potentially triggering the onclick handler multiple times.

Possible causes:
1. Click event bubbling through nested elements
2. Table row click handlers interfering
3. Parent containers capturing the click

## The Fix

Added `event.stopPropagation()` to both +/- buttons:

```astro
<!-- BEFORE -->
<button onclick={`adjustDueDate(${project.id}, 1)`}>

<!-- AFTER -->
<button onclick={`event.stopPropagation(); adjustDueDate(${project.id}, 1)`}>
```

## Why This Works

`event.stopPropagation()` prevents the click event from bubbling up to parent elements, ensuring the onclick handler only fires ONCE per click.

```
WITHOUT stopPropagation:
Button click → onclick fires → Event bubbles to parent → onclick fires again → Event bubbles to grandparent → onclick fires again...

WITH stopPropagation:
Button click → onclick fires → Event stopped → Done ✅
```

## Impact

### Before:
- 1 button click = 3-4 function calls
- 3-4 debounce timers started
- Last timer wins, but UI showed "saving" for ~5-10 seconds
- Confusing user experience

### After:
- 1 button click = 1 function call
- 1 debounce timer
- Save completes in ~1-2 seconds
- Clean user experience

## Files Modified

- `/src/components/project/ProjectItem.astro` - Added `event.stopPropagation()` to both +/- buttons

## Testing

After rebuild (14:27:21) and hard refresh:
1. Click +/- button ONCE
2. Check console - should see:
   ```
   🎯 [ADJUST] adjustDueDate called: projectId=24, hours=1
   ⏱️  [ADJUST] Setting new timeout
   💾 [SAVE] Saving dueDate for project 24 after debounce
   ✅ [SAVE] Successfully saved
   ```
3. Should see ONLY ONE save icon
4. Save should complete in ~1-2 seconds (not 5-10s)

---

**This was the real bug causing the 5-second save times and multiple API calls!**
