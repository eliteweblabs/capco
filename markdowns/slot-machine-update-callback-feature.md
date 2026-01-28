# SlotMachineModalStaff Update Callback Feature

## Overview

Added an `updateCallback` parameter to `SlotMachineModalStaff.astro` that allows components to specify a JavaScript function to be called after a successful API update. This enables immediate UI updates without requiring a page refresh.

## Problem Solved

When assigning a project to staff using the SlotMachineModalStaff component, the UI would only show the text value (staff name) immediately after assignment. The proper icon/avatar would only appear after refreshing the page because the `UserIcon` component is rendered server-side based on the `project?.assignedToProfile` prop.

### Before
- Assign staff → Shows text value only
- Refresh page → Shows proper UserIcon avatar

### After
- Assign staff → Immediately shows proper UserIcon avatar
- No refresh needed

## Implementation

### 1. SlotMachineModalStaff Component Changes

Added new prop:
```typescript
updateCallback?: string; // Optional: JavaScript function name to call after successful update
```

The callback is invoked after a successful API response in the `saveToAPI` function:

```javascript
if (updateCallback && typeof window[updateCallback] === "function") {
  window[updateCallback](result, value, label);
}
```

### 2. API Endpoint Enhancement

Updated `/src/pages/api/utils/assign-staff.ts` to return the full profile data:

```typescript
// Fetch the updated project with assignedToProfile data
let assignedToProfile = null;
if (assignedToId) {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, name, email, companyName")
    .eq("id", assignedToId)
    .single();
  
  assignedToProfile = profileData;
}

// Return in response
return {
  success: true,
  modalData: { ... },
  updatedProject: {
    id: projectId,
    assignedToId: assignedToId,
    assignedToProfile: assignedToProfile,
  },
};
```

### 3. ProjectItem Component Implementation

Added callback function in ProjectItem script:

```javascript
window[`updateStaffIcon_${projectId}`] = function (result, assignedToId, staffName) {
  const staffElement = document.querySelector(`#assign-staff-slot-machine-${projectId}`);
  
  if (result?.updatedProject?.assignedToProfile) {
    const profile = result.updatedProject.assignedToProfile;
    
    // Create initials
    const fullName = profile.companyName || profile.name || "User";
    const initials = fullName
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
    
    // Update HTML with UserIcon styling
    staffElement.innerHTML = `
      <div class="w-8 h-8 text-sm rounded-full border-2 border-white shadow-sm 
                  bg-gradient-to-br from-primary-500 to-purple-600 
                  flex items-center justify-center text-white font-medium">
        ${initials}
      </div>
    `;
  } else {
    // Show default icon for unassigned
    staffElement.innerHTML = `<svg>...</svg>`;
  }
};
```

Pass the callback name to SlotMachineModalStaff:

```astro
<SlotMachineModalStaff
  id={`assign-staff-slot-machine-${project.id}`}
  updateCallback={`updateStaffIcon_${project.id}`}
  {/* other props */}
/>
```

## Usage Pattern

1. **Define a callback function** on the window object (typically in the parent component's script)
2. **Pass the function name** as a string to the `updateCallback` prop
3. **API endpoint must return** the necessary data in the response
4. **Callback receives** three parameters: `(result, value, label)`
   - `result`: Full API response object
   - `value`: Selected value (e.g., staff ID)
   - `label`: Selected label (e.g., staff name)

## Benefits

- ✅ Immediate UI feedback without page refresh
- ✅ Better user experience
- ✅ Consistent with real-time behavior of other components
- ✅ Flexible - can be used for any SlotMachineModalStaff instance
- ✅ Backward compatible - updateCallback is optional

## Example: Other Use Cases

This pattern can be extended to any SlotMachineModalStaff usage where immediate UI updates are desired:

```astro
<!-- Status picker -->
<SlotMachineModalStaff
  id="status-picker"
  updateCallback="updateProjectStatus"
/>

<script>
  window.updateProjectStatus = function(result, statusId, statusName) {
    // Update status badge color, text, etc.
  };
</script>
```

## Files Modified

1. `/src/components/form/SlotMachineModalStaff.astro`
   - Added `updateCallback` prop to interface
   - Added callback invocation in `saveToAPI` success handler

2. `/src/pages/api/utils/assign-staff.ts`
   - Fetch and return `assignedToProfile` data

3. `/src/components/project/ProjectItem.astro`
   - Added `updateStaffIcon_${projectId}` callback function
   - Pass `updateCallback` prop to SlotMachineModalStaff

## Testing

1. Navigate to project list
2. Click on staff assignment icon
3. Select a staff member
4. Verify icon updates immediately to show avatar with initials
5. Verify no page refresh is needed
6. Test unassignment (selecting no staff) shows default icon
