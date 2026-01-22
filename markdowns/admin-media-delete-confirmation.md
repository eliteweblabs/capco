# Admin Media Delete Confirmation Pattern

## Summary

Updated the admin media manager to use the same delete confirmation pattern as the ProposalManager instead of a system alert dialog.

## Changes

### Before
- Clicking the trash icon showed a browser `confirm()` dialog
- User had to click OK/Cancel in the modal

### After
- First click: Trash icon changes to "?" (question mark)
- Button pulses with animation to draw attention
- User has 3 seconds to click the "?" to confirm
- If not clicked within 3 seconds, reverts back to trash icon
- No blocking system dialog

## Implementation Details

### 1. Updated Delete Button HTML
- Added unique `id` for each delete button: `delete-btn-${file.id}`
- Added `data-state="trash"` attribute to track button state
- Changed class from `delete-btn` to `delete-file-btn` for clarity
- Used inline SVG for trash icon (matches ProposalManager pattern)

### 2. Added `confirmDelete` Utility Function
The function handles:
- State management (`trash` → `confirm` → execute)
- Visual feedback (icon swap, style changes)
- Auto-revert timeout (3 seconds default)
- Cleanup of timeouts

### 3. Updated Event Handler
- Removed `confirm()` dialog
- Added `confirmDelete()` call with callback
- Maintains the same delete API call logic

### 4. Added Pulse Animation
CSS keyframes for the pulsing effect when in confirmation state:
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## User Experience

1. Hover over a file card
2. Click the red trash icon
3. Icon changes to white "?" on red background with pulse animation
4. Title updates to "Click again to confirm deletion"
5. User has 3 seconds to:
   - Click again → File is deleted
   - Wait → Button reverts to trash icon (no action taken)

## Files Modified

- `/src/components/admin/AdminMedia.astro` - Complete implementation

## Benefits

- **Consistent UX**: Matches the pattern used in ProposalManager
- **Better feedback**: Visual animation draws attention to confirmation state
- **Non-blocking**: Doesn't use system modal that blocks the entire page
- **Accidental delete prevention**: Two-click requirement prevents accidents
- **Time-limited**: Auto-reverts if user changes their mind
