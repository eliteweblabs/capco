# Feature: Admin Punchlist Item Management at Project Level

## Overview

Added the ability for Admins to add and delete punchlist items at the project level in the punchlist drawer. This allows customization of punchlist items for specific projects, even after the project has been created by a client.

## Problem Solved

- Punchlist templates are generally the same across projects, but there are instances when Admin needs to customize at the project level
- When projects are deployed by clients, Admin cannot edit the punchlist in advance
- Need flexibility to add/remove items specific to individual projects

## Implementation

### 1. Add Punchlist Item Button

**Location**: Punchlist drawer, at the top of the items list
**Visibility**: Admins only
**Functionality**:

- Opens prompts to collect:
  - Title (required)
  - Description/message (optional, defaults to title)
- Creates new punchlist item for the current project
- Items default to:
  - `markCompleted: false` (incomplete)
  - `internal: false` (visible to all)
- Automatically reloads and re-renders the punchlist after adding

### 2. Delete Punchlist Item Button

**Location**: On each punchlist item card
**Component**: `DeleteConfirmButton`
**Visibility**: Admins only
**Functionality**:

- Shows confirmation dialog before deletion
- Deletes item via `/api/punchlist/delete` endpoint
- Automatically updates the punchlist display
- Shows success notification

## Files Modified

### `/src/components/project/Punchlist.astro`

- Added `Button` import
- Added "Add Punchlist Item" button (Admin only) at top of punchlist drawer
- Added `addPunchlistBtn` click handler:
  - Prompts for title and description
  - Calls `/api/punchlist/upsert` to create item
  - Reloads and re-renders list
- Added `window.handlePunchlistDelete` callback:
  - Removes item from local array
  - Re-renders the list
  - Updates incomplete count

### `/src/components/common/PunchList.astro`

- Added `DeleteConfirmButton` import
- Added `isAdmin` variable to check if user is Admin
- Updated layout from `justify-between` to `gap-3` for better spacing
- Added delete button section for Admins:
  - Uses `DeleteConfirmButton` component
  - Positioned in flex-shrink-0 div for consistent placement
  - Configured with:
    - `itemType="punchlist"`
    - `apiEndpoint="/api/punchlist/delete"`
    - `onDeleteCallback="handlePunchlistDelete"`
    - Custom confirmation message

## User Experience

### For Admins:

1. **Adding Items**:
   - Click "Add Punchlist Item" button at top of drawer
   - Enter title in first prompt
   - Enter description in second prompt (or leave as title)
   - Item appears immediately in the list
   - Success notification confirms addition

2. **Deleting Items**:
   - Click trash icon on any punchlist item
   - Confirm deletion in modal dialog
   - Item is removed from list immediately
   - Success notification confirms deletion

### For Clients/Staff:

- No changes to UI (buttons are hidden)
- Can still view and toggle completion status as before

## API Endpoints Used

- `POST /api/punchlist/upsert` - Creates new punchlist item
- `POST /api/punchlist/delete` - Deletes punchlist item
- `GET /api/punchlist/get` - Fetches punchlist items (existing)

## Notes

- Add/delete functionality is scoped to individual projects
- Does not affect project templates at `/project/settings`
- Templates are still applied when new projects are created
- Project-level customizations persist only for that project
- Maintains separation between global templates and project-specific items
