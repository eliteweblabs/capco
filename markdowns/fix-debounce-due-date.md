# Fix: Debounce Not Working on Due Date Buttons

## Problem Identified

The user reported **123+ second fetch times** on dashboard. The issue was:

**Every +/- button click was triggering `updateProjectField()` immediately**, which would:
1. Show "saving" spinner
2. Clear the timeout
3. Start a NEW 500ms timer
4. **But the UI update happened on EVERY click**

So clicking +10 times = 10 UI updates + 10 fetch calls queued (even though only last one should fire).

## Root Cause

```javascript
// OLD CODE (BAD):
window.adjustDueDate = async function (projectId, hours) {
  // ... calculate new date ...
  
  // This calls updateProjectField IMMEDIATELY on every click
  await updateProjectField(input, date.toISOString(), formatter);
  //     ↑ Shows "saving" spinner + queues fetch
};
```

**Problem:** `updateProjectField` was being called synchronously on every button click, even though it had debouncing internally.

## Solution

**Inline the debouncing logic directly in `adjustDueDate`:**

```javascript
// NEW CODE (GOOD):
window.adjustDueDate = async function (projectId, hours) {
  // 1. Update UI IMMEDIATELY (instant feedback)
  input.value = displayValue;
  input.setAttribute("data-due-date", newISO);
  input.classList.add("saving");
  
  // 2. Clear existing timeout
  if (window[timeoutKey]) {
    clearTimeout(window[timeoutKey]);
  }
  
  // 3. Only fetch after 500ms of NO MORE CLICKS
  window[timeoutKey] = setTimeout(async () => {
    const response = await fetch("/api/projects/upsert", {
      method: "PUT",
      body: JSON.stringify({ id: projectId, dueDate: newISO })
    });
    // ... handle success/error ...
  }, 500);
};
```

## How It Works Now

**User clicks +/- button 10 times rapidly:**

1. **Click 1:** Update UI → Start 500ms timer
2. **Click 2:** Update UI → **Cancel timer** → Start NEW 500ms timer
3. **Click 3:** Update UI → **Cancel timer** → Start NEW 500ms timer
4. **...** (repeat)
5. **Click 10:** Update UI → **Cancel timer** → Start NEW 500ms timer
6. **500ms passes with NO clicks** → **ONE fetch call happens**

**Result:** 10 clicks = 1 API call (not 10!)

## Performance Impact

### Before Fix:
- 10 rapid clicks = 10 fetch calls queued
- Each fetch takes ~1-2s
- Total time: 10-20 seconds of network activity
- User sees: Continuous "saving" spinner

### After Fix:
- 10 rapid clicks = 1 fetch call (after 500ms)
- Fetch takes ~1-2s
- Total time: <2 seconds
- User sees: Brief "saving" → "saved" checkmark

## Files Modified

- `/src/scripts/project-item-handlers.ts` - Rewrote `adjustDueDate` to inline debouncing

## Testing

1. Load dashboard
2. Click +/- button on due date **10 times rapidly**
3. Should see:
   - UI updates immediately on each click
   - "Saving" spinner shows
   - **Only ONE network request** after you stop clicking
   - "Saved" checkmark after ~500ms

## Key Insight

**Debouncing should happen BEFORE the expensive operation (fetch), not inside it.**

- ❌ **Bad:** Call function that has internal debouncing (still shows UI changes)
- ✅ **Good:** Debounce at the call site, only trigger expensive operation after delay
