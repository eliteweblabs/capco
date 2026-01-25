# GridFilter Component

A reusable filtering system for grid-based content (projects, media, files, etc.)

## Features

- **Button-style filters**: Filter by categories with button toggles
- **Dropdown filters**: Multiple dropdown filters with customizable options
- **Search functionality**: Real-time search across items
- **Responsive design**: Mobile-friendly layout
- **No results state**: Automatic handling of empty results
- **Flexible data attributes**: Works with any data structure

## Usage

### Button Filters (like ProjectPortfolio)

```astro
<GridFilter
  filters={["All Projects", "New Construction", "Renovation"]}
  itemSelector=".project-item"
  dataAttribute="data-category"
/>

<!-- Your grid items -->
<div class="grid">
  <div class="project-item" data-category="New Construction">...</div>
  <div class="project-item" data-category="Renovation">...</div>
</div>
```

### Dropdown Filters with Search (like MediaManager)

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
      defaultValue: "all",
    },
    type: {
      label: "Type",
      options: [
        { value: "all", label: "All Types" },
        { value: "image", label: "Images" },
        { value: "pdf", label: "PDFs" },
      ],
      defaultValue: "all",
    },
  }}
  itemSelector=".file-card"
  showSearch={true}
  searchPlaceholder="Search files..."
  searchDataAttribute="data-file-name"
  noResultsId="no-results"
/>

<!-- Your grid items -->
<div id="files-grid" class="grid">
  <div
    class="file-card"
    data-file-name="document.pdf"
    data-file-source="project"
    data-file-type="application/pdf"
  >
    ...
  </div>
</div>

<!-- No results element -->
<div id="no-results" class="hidden">No matching results</div>
```

## Props

| Prop                  | Type                                   | Required | Default                  | Description                                     |
| --------------------- | -------------------------------------- | -------- | ------------------------ | ----------------------------------------------- |
| `filters`             | `string[]`                             | No       | `[]`                     | Array of filter values for button-style filters |
| `dataAttribute`       | `string`                               | No       | `"data-category"`        | Data attribute to filter button items by        |
| `dropdownFilters`     | `Record<string, DropdownFilterConfig>` | No       | `{}`                     | Configuration for dropdown filters              |
| `itemSelector`        | `string`                               | Yes      | -                        | CSS selector for items to filter                |
| `showSearch`          | `boolean`                              | No       | `false`                  | Whether to show search input                    |
| `searchPlaceholder`   | `string`                               | No       | `"Search..."`            | Placeholder text for search input               |
| `searchDataAttribute` | `string`                               | No       | `"data-file-name"`       | Data attribute to search within                 |
| `globalInputClasses`  | `string`                               | No       | Default Tailwind classes | Tailwind classes for inputs and dropdowns       |
| `containerClasses`    | `string`                               | No       | Default flex classes     | Container layout classes                        |
| `noResultsId`         | `string`                               | No       | `"no-results"`           | ID of element to show when no results match     |

## DropdownFilterConfig

```typescript
interface DropdownFilterConfig {
  label: string; // Display label for the dropdown
  options: DropdownOption[]; // Array of options
  defaultValue?: string; // Default selected value
}

interface DropdownOption {
  value: string; // Option value
  label: string; // Option label
}
```

## Examples

### Simple Category Filter

```astro
<GridFilter
  filters={["All", "Active", "Completed", "Archived"]}
  itemSelector=".task-item"
  dataAttribute="data-status"
/>
```

### Complex Multi-Filter System

```astro
<GridFilter
  dropdownFilters={{
    status: {
      label: "Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    priority: {
      label: "Priority",
      options: [
        { value: "all", label: "All Priorities" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
      ],
    },
  }}
  itemSelector=".task-item"
  showSearch={true}
  searchPlaceholder="Search tasks..."
  searchDataAttribute="data-title"
/>
```

## Implementation Details

- Filters work by toggling `display: none` on items
- Button filters support an "All" pattern (first button shows all items)
- Dropdown filters with value "all" show all items
- Search is case-insensitive and uses partial matching
- Multiple filters work together (AND logic)
- No results element is automatically shown/hidden

## Current Implementations

1. **ProjectPortfolio** (`src/components/common/ProjectPortfolio.astro`)
   - Button-style category filters
   - Filters by construction type

2. **MediaManager** (`src/components/admin/AdminMedia.astro`)
   - Dropdown filters for source and file type
   - Search by filename
   - Complex filter logic for media types
