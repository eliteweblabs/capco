# Punchlist Component Refactoring

**Date**: January 29, 2026

## Problem

Two components with confusingly similar names existed:

- `src/components/project/Punchlist.astro` - The drawer/sidebar container (589 lines)
- `src/components/common/PunchList.astro` - Individual item renderer (78 lines)

The only difference in naming was capitalization (`Punchlist` vs `PunchList`), which made it unclear what each component did.

## Solution

Renamed both components to clarify their purposes:

- `Punchlist.astro` → **`PunchlistDrawer.astro`** - Full drawer/container component
- `PunchList.astro` → **`PunchlistItem.astro`** - Individual item renderer

## Changes Made

### 1. Created New Components

- `/src/components/project/PunchlistDrawer.astro` - Renamed from Punchlist.astro
  - Also updated to use the `Overlay` component instead of manual backdrop div
- `/src/components/common/PunchlistItem.astro` - Renamed from PunchList.astro

### 2. Updated Imports

- `/src/components/ui/Navbar.astro` - Updated import and usage to `PunchlistDrawer`
- `/src/pages/partials/punchlist.astro` - Updated import and usage to `PunchlistItem`

### 3. Deleted Old Files

- Removed `src/components/project/Punchlist.astro`
- Removed `src/components/common/PunchList.astro`

## Component Descriptions

### PunchlistDrawer.astro

**Purpose**: Full punchlist drawer/sidebar UI component

- Creates the toggle button with menu icon
- Manages the slide-out drawer functionality
- Contains the container where punchlist items are loaded
- Handles opening/closing, swipe-to-close, and all drawer interactions
- Used in: Navbar.astro

### PunchlistItem.astro

**Purpose**: Individual punchlist item renderer (partial component)

- Renders a single punchlist comment/item
- Displays message, toggle checkbox, and delete button
- Exported as a partial (`export const partial = true`)
- Used in: `/partials/punchlist` endpoint, loaded dynamically by PunchlistDrawer

## Benefits

1. **Clear naming** - Component names now describe their purpose
2. **Better organization** - Easier to find the right component
3. **Improved maintainability** - Less confusion for future developers
4. **Consistent patterns** - Follows naming convention of other drawer components
5. **Bonus improvement** - PunchlistDrawer now uses the reusable Overlay component

## No Breaking Changes

All functionality remains the same. This is purely a refactoring for clarity.
