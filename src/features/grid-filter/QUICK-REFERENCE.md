# GridFilter Component - Quick Reference

## Component Location

`src/features/grid-filter/GridFilter.astro`

## Implementation Status

✅ Component Created  
✅ ProjectPortfolio Updated  
✅ AdminMedia Updated  
✅ Build Successful  
✅ Documentation Complete

---

## Quick Usage

### Pattern 1: Button Filters (ProjectPortfolio)

```astro
<GridFilter
  filters={["All Projects", "New Construction", "Renovation"]}
  itemSelector=".project-item"
  dataAttribute="data-category"
/>
```

### Pattern 2: Dropdown + Search (AdminMedia)

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
      ],
    },
  }}
  itemSelector=".file-card"
  showSearch={true}
  searchPlaceholder="Search files..."
  searchDataAttribute="data-file-name"
/>
```

---

## Key Props

| Prop                  | Type       | Description                       |
| --------------------- | ---------- | --------------------------------- |
| `filters`             | `string[]` | Button-style filter options       |
| `dropdownFilters`     | `object`   | Dropdown filter configurations    |
| `itemSelector`        | `string`   | CSS selector for grid items       |
| `showSearch`          | `boolean`  | Enable search input               |
| `searchPlaceholder`   | `string`   | Search input placeholder          |
| `searchDataAttribute` | `string`   | Data attribute to search          |
| `dataAttribute`       | `string`   | Data attribute for button filters |
| `noResultsId`         | `string`   | ID of no-results element          |

---

## Current Implementations

### 1. ProjectPortfolio (Public)

- **Location**: `src/components/common/ProjectPortfolio.astro`
- **Type**: Button filters
- **Filters**: All Projects, New Construction, Renovation
- **Data Attribute**: `data-category`

### 2. MediaManager (Admin)

- **Location**: `src/components/admin/AdminMedia.astro`
- **Type**: Dropdown filters + Search
- **Filters**:
  - Source: All/Project/Global
  - Type: All/Images/PDFs/Documents/Other
- **Search**: By filename

---

## Files Changed

```
Created:
  ✅ src/features/grid-filter/GridFilter.astro
  ✅ src/features/grid-filter/README.md
  ✅ markdowns/grid-filter-implementation.md

Modified:
  ✅ src/components/common/ProjectPortfolio.astro
  ✅ src/components/admin/AdminMedia.astro
```

---

## Benefits

✨ **DRY**: Single source of truth for filter logic  
✨ **Consistent**: Uniform UX across the app  
✨ **Flexible**: Supports multiple filter patterns  
✨ **Reusable**: Works with any grid-based content  
✨ **Maintainable**: Easy to update in one place

---

## Testing URLs

- **Projects**: `/projects` or homepage (ProjectPortfolio component)
- **Media**: `/admin/media` (AdminMedia component)

---

## Notes

- Filters use `display: none` to hide items
- Multiple filters work together (AND logic)
- "All" option shows all items
- Search is case-insensitive with partial matching
- Each instance has a unique ID to prevent conflicts
- Fully responsive with mobile-friendly layout
