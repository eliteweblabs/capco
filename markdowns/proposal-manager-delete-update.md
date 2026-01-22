# ProposalManager Delete Confirmation Update

## Summary
Updated ProposalManager to use the same delete confirmation pattern as the DeleteConfirmButton component for consistent UX across the application.

## Changes Made

### File: `/src/components/project/ProposalManager.astro`

#### 1. Updated `confirmDelete` Function
**Lines ~300-356**

**Before:**
- Used dark/light text colors that were hard to see
- Different styling from the rest of the app
- No visual reset on confirmation

**After:**
- Matches DeleteConfirmButton styling exactly
- **Trash state**: Red text (`text-red-600`) on transparent background
- **Confirm state**: White background with red text, pulsing animation
- **Resets button state** before executing callback (prevents visual glitch)
- Consistent hover states and transitions

#### 2. Added Pulse Animation
**End of file (before closing tags)**

Added the same pulse animation used in DeleteConfirmButton:
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.pulse {
  animation: pulse 0.8s ease-in-out infinite;
}
```

## How It Works

### User Flow
1. User clicks delete button in proposal line items table
2. Button shows `?` icon and pulses with white background
3. User has 3 seconds to click `?` again to confirm
4. If confirmed: item is deleted
5. If not confirmed: button reverts to trash icon

### Technical Implementation

The delete buttons are dynamically generated in JavaScript when rendering line items:

```javascript
// In renderLineItems()
<button 
  type="button"
  id="delete-btn-${index}"
  onclick="confirmDelete('delete-btn-${index}', () => window.proposalManager.deleteProposalRow(${index}))"
  class="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors delete-btn"
  title="Delete line item"
  data-state="trash"
>
  <svg>...</svg>
</button>
```

The inline `confirmDelete` function handles the 2-step confirmation without system alerts.

## Benefits

### ✅ Consistent UX
- Same delete pattern as banner alerts, media files, and future features
- Users learn the pattern once and it works everywhere
- No jarring browser confirm() dialogs

### ✅ Visual Feedback
- Pulsing animation draws attention during confirmation state
- Clear color changes (red → white with red icon)
- Smooth transitions between states

### ✅ Safe Operations
- 2-step confirmation prevents accidental deletions
- Auto-revert provides safety net
- Clear visual indication of each state

### ✅ Maintainable
- Follows established pattern from DeleteConfirmButton
- Documented and consistent
- Easy to understand and modify

## Styling Details

### Trash State (Default)
```css
p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors delete-btn
```
- Red icon on transparent background
- Subtle hover effect (darker red + light red background)

### Confirm State (After First Click)
```css
p-1 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded transition-all delete-btn pulse
```
- White background with red `?` icon
- Pulsing animation (scale 1.0 → 1.1 → 1.0)
- Inverted hover (red background with white icon)

## Why Inline Implementation?

ProposalManager uses an inline `confirmDelete` function instead of importing the DeleteConfirmButton component because:

1. **Dynamic Row Generation**: Line items are created dynamically in JavaScript, not server-side Astro
2. **Performance**: Avoids creating many component instances for each row
3. **Simplicity**: Single function handles all delete buttons in the table
4. **Existing Pattern**: ProposalManager already used this approach, just needed styling updates

The inline implementation **matches the DeleteConfirmButton behavior exactly**, ensuring consistent UX.

## Testing Checklist

- [ ] Create a proposal with multiple line items
- [ ] Click delete on a line item → should show `?` icon with pulse
- [ ] Wait 3+ seconds → should revert to trash icon
- [ ] Click delete → click `?` within 3s → line item should be removed
- [ ] Verify no browser confirm() dialogs appear
- [ ] Check styling matches banner alerts delete buttons
- [ ] Test in both light and dark modes
- [ ] Verify animation is smooth and non-distracting

## Related Files
- Pattern source: `/src/components/common/DeleteConfirmButton.astro`
- Also uses pattern: `/src/pages/admin/banner-alerts.astro`
- Also uses pattern: `/src/components/admin/AdminMedia.astro`

## Notes
- The delete confirmation only applies to **proposal line items** within the table
- Other delete operations in the app should use the `DeleteConfirmButton` component directly where possible
- This inline implementation is specific to ProposalManager's dynamic table rendering
