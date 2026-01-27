# Inline Address Search - Dropdown Refactor

## Summary
Converted the inline address search component from a fixed-height results box to a Flowbite-style dropdown that only appears when there are search results.

## Changes Made

### 1. Created Reusable Module (`src/scripts/inline-address-search.ts`)
- **Purpose**: Shared TypeScript module containing all address search logic
- **Exports**:
  - `initializeAddressSearch(config)` - Main initialization function
  - `createAddressSearchHTML(config)` - HTML structure generator
- **Features**:
  - Dropdown show/hide logic
  - Google Places API integration
  - Keyboard navigation (Arrow Up/Down, Enter, Escape)
  - Click-outside-to-close behavior
  - Custom event dispatching
  - Configurable API endpoint, params, and callbacks

### 2. Updated `InlineAddressSearch.astro` Component
- Refactored to use the shared module
- Removed ~230 lines of duplicate JavaScript
- Now imports and initializes from the shared module
- Maintains same API/props interface

### 3. Updated `MultiStepProjectForm.astro`
- Replaced inline HTML generation with `createAddressSearchHTML()` helper
- Removed ~220 lines of duplicate address search logic
- Uses `initializeAddressSearch()` from shared module
- Made `renderStep()` async to support dynamic imports

### 4. UI/UX Improvements
- **Dropdown Style**: Flowbite-compliant design
  - `shadow-lg` for dropdown shadow
  - `bg-white dark:bg-gray-700` with proper dark mode
  - `max-h-60 overflow-y-auto` for scrollable results
- **Visibility**: Hidden by default, only shows when results exist
- **Hover States**: `hover:bg-gray-100 dark:hover:bg-gray-600`
- **Selection**: `bg-gray-100 dark:bg-gray-600` for selected items
- **Positioning**: Absolute below input with `z-10 mt-2`
- **Auto-close**: Hides after selection or when clicking outside

## Files Changed

1. **Created**: `src/scripts/inline-address-search.ts` (390 lines)
2. **Modified**: `src/components/form/InlineAddressSearch.astro` (reduced ~230 lines)
3. **Modified**: `src/components/project/MultiStepProjectForm.astro` (reduced ~220 lines)

## Benefits

- **DRY**: Single source of truth for address search logic
- **Maintainability**: Bug fixes and features apply to all instances
- **Consistency**: Same UX across all address search components
- **Type Safety**: TypeScript module with interfaces
- **Smaller Bundle**: Shared code reduces duplication
- **Better UX**: Cleaner dropdown that doesn't take up space when unused

## Testing

Test on the following pages:
- `/project/new-inline` - Multi-step form
- Any page using `<InlineAddressSearch />` component

Expected behavior:
1. Input field shows placeholder
2. Nothing else visible initially
3. Type 2+ characters to trigger search
4. Dropdown appears with results
5. Hover shows gray background
6. Click selects and hides dropdown
7. Escape key closes dropdown
8. Arrow keys navigate results
9. Enter key selects highlighted result

## Future Enhancements

- Add debounce configuration option
- Support multiple result sources
- Add result caching
- Custom result templates
- Loading spinner during search
