# GridFilter Component Implementation

**Date**: 2026-01-24  
**Component**: GridFilter.astro  
**Location**: `src/features/grid-filter/GridFilter.astro`

## Overview

Created a reusable GridFilter component to standardize filtering across the application. This component supports both button-style filters (like ProjectPortfolio) and dropdown filters (like MediaManager).

## Key Features

1. **Button-style Filters**
   - Toggle between categories
   - First button typically acts as "All" filter
   - Active state styling
   - Example: Project categories (All Projects, New Construction, Renovation)

2. **Dropdown Filters**
   - Multiple independent dropdown filters
   - Configurable options per dropdown
   - Default value support
   - Example: Media source and type filters

3. **Search Functionality**
   - Real-time search
   - Case-insensitive partial matching
   - Customizable data attribute target

4. **Smart Filter Logic**
   - Multiple filters work together (AND logic)
   - "All" option shows all items
   - Automatic empty state handling

## Implementation

### Component Structure

```
src/features/grid-filter/
├── GridFilter.astro       # Main component
└── README.md             # Documentation
```

### Components Updated

1. **ProjectPortfolio** (`src/components/common/ProjectPortfolio.astro`)
   - Replaced inline filter buttons with GridFilter component
   - Removed custom filter script
   - Simplified template

2. **AdminMedia** (`src/components/admin/AdminMedia.astro`)
   - Replaced inline search and filter selects with GridFilter component
   - Removed custom filter function
   - Cleaner component structure

## Technical Details

### Props Interface

```typescript
interface Props {
  // Button filters
  filters?: string[];
  dataAttribute?: string;

  // Dropdown filters
  dropdownFilters?: Record<string, DropdownFilterConfig>;

  // Common
  itemSelector: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchDataAttribute?: string;
  globalInputClasses?: string;
  containerClasses?: string;
  noResultsId?: string;
}
```

### Filter Logic

- **Button Filters**: Checks if item's data attribute matches selected filter
- **Dropdown Filters**: Custom logic per filter type (source, type, etc.)
- **Search**: Matches search term against specified data attribute
- **Visibility**: Uses `display: none` to hide non-matching items

### Unique Features

1. **Unique IDs**: Each instance gets a unique ID to avoid conflicts
2. **State Management**: Maintains filter state across multiple dropdowns
3. **Responsive Design**: Mobile-friendly layout with flex wrapping
4. **No Dependencies**: Pure JavaScript, no external libraries

## Usage Examples

### Button Filters (ProjectPortfolio)

```astro
<GridFilter
  filters={["All Projects", "New Construction", "Renovation"]}
  itemSelector=".project-item"
  dataAttribute="data-category"
/>
```

### Dropdown + Search (MediaManager)

```astro
<GridFilter
  dropdownFilters={{
    source: {
      label: "Source",
      options: [
        { value: "all", label: "All Sources" },
        { value: "project", label: "Project Files" },
        { value: "global", label: "Global Files" },
      ],
    },
    type: {
      label: "Type",
      options: [
        { value: "all", label: "All Types" },
        { value: "image", label: "Images" },
        { value: "pdf", label: "PDFs" },
        { value: "document", label: "Documents" },
      ],
    },
  }}
  itemSelector=".file-card"
  showSearch={true}
  searchPlaceholder="Search files..."
  searchDataAttribute="data-file-name"
/>
```

## Benefits

1. **DRY Principle**: Single source of truth for filter logic
2. **Consistency**: Uniform filter UX across the app
3. **Maintainability**: Easier to update filter behavior in one place
4. **Flexibility**: Supports multiple filter patterns
5. **Reusability**: Can be used in any grid-based view

## Future Enhancements

Potential improvements for future iterations:

1. Add sorting capabilities
2. Support for range filters (dates, numbers)
3. Filter state persistence (localStorage/URL params)
4. Export/import filter configurations
5. Analytics/tracking for filter usage
6. Animation for filter transitions
7. Keyboard navigation support

## Testing Checklist

- [ ] ProjectPortfolio filters work correctly
- [ ] MediaManager filters work correctly
- [ ] Search functionality works in MediaManager
- [ ] Multiple filters work together properly
- [ ] "No results" state displays correctly
- [ ] Mobile responsive layout
- [ ] Button active states update correctly
- [ ] Dropdown values persist correctly

## Related Files

- `src/components/common/ProjectPortfolio.astro` - Uses button filters
- `src/components/admin/AdminMedia.astro` - Uses dropdown filters + search
- `src/features/grid-filter/README.md` - Component documentation
