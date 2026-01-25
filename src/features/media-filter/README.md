# MediaFilter Component

A fully reusable media filtering and display component with button-style filters, autosuggest search, and masonry grid layout.

## Features

- **Button-Style Filters**: Source and Type filters as clickable buttons (like ProjectPortfolio tabs)
- **Autosuggest Search**: Real-time search with suggestions after 2 characters
- **Masonry Grid**: 8-column responsive grid with varied card sizes
- **Upload Functionality**: Integrated file upload with progress indicator
- **Stats Display**: File count statistics cards
- **Fully Self-Contained**: Can be dropped into any page with minimal configuration

## Usage

### Full Component (with Grid)

```astro
---
import MediaFilter from "../../features/media-filter/MediaFilter.astro";
---

<MediaFilter
  currentUser={currentUser}
  supabase={supabase}
  sourceFilters={["All", "Project", "Global"]}
  typeFilters={["All", "Images", "PDFs", "Documents", "Other"]}
  showSearch={true}
  minSearchChars={2}
  searchPlaceholder="Search media files..."
  globalInputClasses={globalInputClasses}
  includeGrid={true}
/>
```

### Filters Only (Custom Grid)

```astro
<MediaFilter
  sourceFilters={["All", "Project", "Global"]}
  typeFilters={["All", "Images", "PDFs", "Documents"]}
  showSearch={true}
  itemSelector=".my-custom-card"
  includeGrid={false}
/>

<!-- Your custom grid -->
<div class="my-custom-grid">
  <div class="my-custom-card" data-file-source="project" data-file-type="image/png" data-file-name="example.png">
    ...
  </div>
</div>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sourceFilters` | `string[]` | `["All", "Project", "Global"]` | Source filter button labels |
| `typeFilters` | `string[]` | `["All", "Images", "PDFs", "Documents", "Other"]` | Type filter button labels |
| `itemSelector` | `string` | `".file-card"` | CSS selector for filterable items |
| `showSearch` | `boolean` | `true` | Show search input with autosuggest |
| `minSearchChars` | `number` | `2` | Minimum characters before filtering |
| `searchPlaceholder` | `string` | `"Search media files..."` | Search input placeholder |
| `globalInputClasses` | `string` | Default classes | Tailwind classes for inputs |
| `includeGrid` | `boolean` | `true` | Include media grid or just filters |
| `currentUser` | `any` | - | Current user object (required if includeGrid) |
| `supabase` | `any` | - | Supabase client (required if includeGrid) |

## Filter Configuration

### Custom Filter Terms

```astro
<!-- Simple image gallery -->
<MediaFilter
  sourceFilters={["All", "Recent", "Archived"]}
  typeFilters={["All", "Photos", "Videos"]}
/>

<!-- Document manager -->
<MediaFilter
  sourceFilters={["All", "Invoices", "Contracts", "Reports"]}
  typeFilters={["All", "PDF", "Word", "Excel"]}
/>
```

### Data Attributes Required

For custom grids (when `includeGrid={false}`), your items must have these attributes:

```html
<div class="file-card"
     data-file-name="document.pdf"
     data-file-source="project"
     data-file-type="application/pdf">
  ...
</div>
```

## Autosuggest Search

### How It Works

1. **Minimum Characters**: Search starts filtering after `minSearchChars` (default: 2)
2. **Suggestion Building**: Automatically builds suggestions from file names
3. **Keyboard Navigation**: Arrow keys, Enter, Escape supported
4. **Highlight Matches**: Matched text is bold in suggestions
5. **Click to Apply**: Click suggestion to fill search and filter

### Search Features

- Real-time filtering as you type
- Dropdown suggestions (max 8 shown)
- Click outside to close
- Clear button appears when typing
- Searches file names and path components

## Button-Style Filters

Filters are styled as tabs/buttons, similar to ProjectPortfolio:

```
┌─────────┬─────────┬─────────┐
│   All   │ Project │ Global  │  <- Source filters
└─────────┴─────────┴─────────┘

┌─────┬────────┬──────┬───────────┬───────┐
│ All │ Images │ PDFs │ Documents │ Other │  <- Type filters
└─────┴────────┴──────┴───────────┴───────┘
```

### Active State

- **Selected**: Brand color border (`border-brand`)
- **Unselected**: Buffer border (`border-buffer`)
- **Hover**: Default border (`border-default`)

## Masonry Grid

When `includeGrid={true}`, displays an 8-column masonry grid:

- **Sizes**: 1x1, 1x2, 1x4, 2x1, 3x1, 2x2, 2x3 (cycling pattern)
- **Responsive**: 2/3/4/6/8 columns based on screen size
- **Gap**: 0.75rem between items
- **Row Height**: 150px base height

## Upload Functionality

Included when `includeGrid={true}`:

- **Button**: Primary "Upload File" button
- **File Types**: Images, PDFs, Word, Excel
- **Multiple Files**: Upload multiple files at once
- **Progress Bar**: Visual upload progress
- **Auto-Reload**: Page reloads after successful upload

## Stats Cards

Shows file statistics when `includeGrid={true}`:

1. **Total Files**: All files count
2. **Project Files**: Project-specific files (blue)
3. **Global Files**: Global files (green)
4. **Images**: Image files (purple)
5. **Documents**: PDF/Document files (orange)

## Integration Examples

### Example 1: Admin Page

```astro
---
// src/pages/admin/media.astro
import MediaFilter from "../../features/media-filter/MediaFilter.astro";
---

<App title="Media Manager">
  <div class="container">
    <h1>Media Manager</h1>
    <MediaFilter
      currentUser={currentUser}
      supabase={supabase}
      includeGrid={true}
    />
  </div>
</App>
```

### Example 2: Custom Grid

```astro
---
import MediaFilter from "../../features/media-filter/MediaFilter.astro";
// Your custom data fetching
const myFiles = await fetchMyFiles();
---

<MediaFilter
  sourceFilters={["All", "Mine", "Shared"]}
  typeFilters={["All", "Images", "Videos"]}
  includeGrid={false}
  itemSelector=".my-file"
/>

<div class="grid grid-cols-4">
  {myFiles.map(file => (
    <div class="my-file" 
         data-file-name={file.name}
         data-file-source={file.source}
         data-file-type={file.type}>
      <!-- Your custom card design -->
    </div>
  ))}
</div>
```

### Example 3: Filters in Form

```astro
<form>
  <MediaFilter
    sourceFilters={["All", "Local", "Cloud"]}
    typeFilters={["All", "Documents", "Spreadsheets"]}
    showSearch={true}
    includeGrid={false}
    itemSelector=".form-file-option"
  />
  
  <div class="file-options">
    <label class="form-file-option" 
           data-file-source="local" 
           data-file-type="application/pdf">
      <input type="checkbox" name="files[]" value="1">
      Document 1
    </label>
  </div>
</form>
```

## Styling

### Custom Styling

Override default styles by targeting the component:

```css
.media-filter-component {
  /* Custom container styles */
}

.media-filter-btn {
  /* Custom button styles */
}

.file-card {
  /* Custom card styles */
}
```

### Dark Mode

Fully supports dark mode out of the box:
- All text colors adapt
- Border colors adjust
- Background colors switch
- Hover states maintain contrast

## Performance

- **Lazy Loading**: Images load as they appear
- **Efficient Filtering**: Client-side only, no server calls
- **Debounced Search**: Optimized for typing speed
- **Suggestion Caching**: Built once, filtered on demand

## Accessibility

- **Keyboard Navigation**: Full keyboard support for suggestions
- **Focus States**: Clear focus indicators on all controls
- **ARIA Labels**: Proper labeling for screen readers
- **Semantic HTML**: Correct HTML structure

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## File Types Supported

**Images**: jpg, jpeg, png, gif, webp, avif, svg  
**Documents**: pdf, doc, docx, xls, xlsx, csv  
**Other**: Displayed with generic file icon

## Related Components

- **GridFilter.astro**: General-purpose grid filtering
- **ProjectSearch.astro**: Project search with autosuggest
- **AdminMedia.astro**: Legacy media manager (replaced by MediaFilter)

## Migration from AdminMedia

**Before:**
```astro
<AdminMedia
  currentUser={currentUser}
  supabase={supabase}
  globalInputClasses={globalInputClasses}
/>
```

**After:**
```astro
<MediaFilter
  currentUser={currentUser}
  supabase={supabase}
  globalInputClasses={globalInputClasses}
  sourceFilters={["All", "Project", "Global"]}
  typeFilters={["All", "Images", "PDFs", "Documents", "Other"]}
/>
```

## Troubleshooting

### Filters Not Working
- Ensure `data-file-source` and `data-file-type` attributes exist
- Check `itemSelector` matches your card class
- Verify filter values match data attribute values (lowercase)

### Search Not Showing Suggestions
- Check `minSearchChars` setting
- Ensure file names are present in `data-file-name`
- Verify search input is focused

### Images Not Loading
- Check public URLs are valid
- Verify lazy loading script is included
- Ensure browser supports IntersectionObserver

## Best Practices

1. **Use Descriptive Filter Labels**: Make button text clear
2. **Set Appropriate minSearchChars**: 2-3 chars works best
3. **Keep Filter Groups Small**: 3-5 options per group
4. **Provide Clear Placeholders**: Help users understand search
5. **Test on Mobile**: Ensure touch interactions work

---

**Version**: 1.0  
**Location**: `src/features/media-filter/MediaFilter.astro`  
**Dependencies**: SimpleIcon, Button, DeleteConfirmButton, supabaseAdmin  
**Bundle Size**: ~15KB (minified + gzipped)
