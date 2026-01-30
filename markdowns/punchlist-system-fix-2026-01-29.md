# Punchlist System Fix - January 29, 2026

## Problem

The punchlist system was showing "Failed to load punchlist item" errors and "Punchlist item not found" errors when trying to toggle completion status or delete items.

## Root Causes

1. **Missing partial endpoint**: The `/partials/punchlist` endpoint was deleted but still being referenced
2. **Incomplete upsert endpoint**: The `/api/punchlist/upsert` only handled updates, not creation
3. **Missing delete endpoint**: No `/api/punchlist/delete` endpoint existed

## Changes Made

### 1. Recreated Partial Endpoint

- **File**: `/src/pages/partials/punchlist-item.astro` (new)
- **Purpose**: Provides the partial endpoint for rendering individual punchlist items
- **Action**: Created new wrapper component that imports `PunchlistItem.astro`

### 2. Updated PunchlistDrawer Reference

- **File**: `/src/components/project/PunchlistDrawer.astro`
- **Change**: Updated line 223 from `/partials/punchlist` to `/partials/punchlist-item`
- **Purpose**: Points to the correct partial endpoint

### 3. Enhanced Upsert Endpoint

- **File**: `/src/pages/api/punchlist/upsert.ts`
- **Changes**:
  - Now handles both CREATE and UPDATE operations
  - Detects operation type based on presence of `punchlistId`
  - CREATE: Requires `projectId` and `message`
  - UPDATE: Requires `punchlistId` and `markCompleted`
  - Both operations require Admin/Staff role
  - Adds activity logging for create operations
- **Purpose**: Single endpoint for creating new items and updating existing ones

### 4. Created Delete Endpoint

- **File**: `/src/pages/api/punchlist/delete.ts` (new)
- **Features**:
  - Accepts `itemId` in request body
  - Validates Admin/Staff permissions
  - Fetches item details before deletion for logging
  - Deletes the punchlist item
  - Logs the deletion activity
  - Returns success/error response
- **Purpose**: Allows admins to delete punchlist items

## API Endpoints Summary

### GET `/api/punchlist/get`

- Fetches all punchlist items for a project
- Filters by user role (Admin/Staff see all, Clients see non-internal only)
- Returns incomplete count

### POST `/api/punchlist/upsert`

**CREATE MODE** (no `punchlistId`):

```json
{
  "projectId": 123,
  "title": "Optional title",
  "message": "Item description",
  "markCompleted": false,
  "internal": false
}
```

**UPDATE MODE** (with `punchlistId`):

```json
{
  "punchlistId": 456,
  "markCompleted": true
}
```

### POST `/api/punchlist/delete`

```json
{
  "itemId": 456
}
```

## Component Integration

### DeleteConfirmButton in PunchlistItem.astro

- Located at lines 48-57
- Only visible to Admin users
- Configured with:
  - `itemType`: "punchlist"
  - `apiEndpoint`: "/api/punchlist/delete"
  - `onDeleteCallback`: "handlePunchlistDelete"
  - Confirmation dialog with custom messages

### Callback Handler in PunchlistDrawer.astro

- `window.handlePunchlistDelete` (lines 517-535)
- Removes item from local array
- Re-renders the list
- Updates incomplete count
- Shows success notification

## Testing Checklist

- [x] Punchlist items load without errors
- [ ] Admin can create new punchlist items
- [ ] Admin can toggle completion status
- [ ] Admin can delete punchlist items
- [ ] Incomplete count updates correctly
- [ ] Activity logging works for create/delete operations
- [ ] Permissions enforced (only Admin/Staff can modify)

## Files Modified

1. `/src/pages/partials/punchlist-item.astro` - Created
2. `/src/components/project/PunchlistDrawer.astro` - Updated fetch path
3. `/src/pages/api/punchlist/upsert.ts` - Enhanced to handle create + update
4. `/src/pages/api/punchlist/delete.ts` - Created

## Files Deleted

1. `/src/pages/partials/punchlist.astro` - Old wrapper (no longer needed)
