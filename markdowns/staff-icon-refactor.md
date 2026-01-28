# Staff Icon Update Refactor

## Why This Change?

Previously, each `ProjectItem.astro` component defined its own `updateStaffIcon_${projectId}` callback function with ~75 lines of duplicate logic for updating the staff avatar/icon after assignment.

## Problem

With 50 projects:
- 50 × 75 lines = **3,750 lines of duplicated staff icon update code**
- Same HTML generation logic repeated 50 times
- Same DOM manipulation repeated 50 times

## Solution

**Moved the staff icon update logic into the global handlers file:**

### `/src/scripts/project-item-handlers.ts`
Added `window.updateStaffIcon()` - A single, reusable function that:
- Takes `projectId`, `result`, `assignedToId`, `staffName` as parameters
- Generates the staff icon/avatar HTML once
- Can be called from any project row

### `/src/components/project/ProjectItem.astro`
**Before (75 lines per project):**
```javascript
window[`updateStaffIcon_${projectId}`] = function (result, assignedToId, staffName) {
  // 75 lines of duplicate logic for:
  // - Finding staff element
  // - Parsing profile data
  // - Creating initials
  // - Generating HTML
  // - Updating DOM
};
```

**After (3 lines per project):**
```javascript
window[`updateStaffIcon_${projectId}`] = function (result, assignedToId, staffName) {
  (window as any).updateStaffIcon(projectId, result, assignedToId, staffName);
};
```

## How SlotMachineModalStaff Uses It

The slot machine component already has support for callbacks via the `updateCallback` prop:

```astro
<SlotMachineModalStaff
  id={`assign-staff-slot-machine-${project.id}`}
  updateCallback={`updateStaffIcon_${project.id}`}
  ...
/>
```

When staff assignment completes:
1. SlotMachine calls `window[updateCallback](result, value, label)`
2. This calls `window.updateStaffIcon_${projectId}`
3. Which calls the global `window.updateStaffIcon(projectId, result, assignedToId, staffName)`
4. The global function updates the DOM once

## Impact

**Before:**
- 50 projects × 75 lines = 3,750 lines of duplicate code

**After:**
- 1 global function (75 lines) + 50 wrappers (3 lines each) = **225 lines total**
- **94% reduction** in staff icon code alone!

## Benefits

1. ✅ **Performance** - Far less JavaScript to parse/compile
2. ✅ **Maintainability** - Update staff icon logic in ONE place
3. ✅ **Consistency** - Same HTML/styling for all projects
4. ✅ **DRY principle** - Don't Repeat Yourself

## Testing

Test staff assignment:
1. Click on a staff avatar icon
2. Select a staff member from the slot machine
3. Verify the avatar updates with correct initials
4. Test unassignment (select "Unassigned")
5. Verify default icon shows

## Related Files

- `/src/scripts/project-item-handlers.ts` - Global `updateStaffIcon()` function
- `/src/components/project/ProjectItem.astro` - Wrapper callback (3 lines)
- `/src/components/form/SlotMachineModalStaff.astro` - Calls `updateCallback` on success
