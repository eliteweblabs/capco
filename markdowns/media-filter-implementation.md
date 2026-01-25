# MediaFilter Implementation Guide

## ✅ What Was Built

A completely reusable media filter component with:
- **Button-style filters** (like ProjectPortfolio tabs) for Source and Type
- **Autosuggest search** that filters after 2 characters
- **Masonry grid** with 8 columns on XL screens
- **Self-contained** - can be dropped anywhere with just props

## 🎯 Key Features

### 1. Button-Style Filters
```
Source: [All] [Project] [Global]
Type:   [All] [Images] [PDFs] [Documents] [Other]
```
- Click to select (single-select per group)
- Active state shows brand color border
- Smooth transitions

### 2. Autosuggest Search
- Starts filtering after **2 characters**
- Dropdown shows up to **8 suggestions**
- Suggestions built from filenames
- **Keyboard navigation**: Arrow keys, Enter, Escape
- **Highlight matches**: Bold matched text
- **Clear button**: X icon when typing

### 3. Reusable Design

**Two Usage Modes:**

#### Mode 1: Full Component (with Grid)
```astro
<MediaFilter
  sourceFilters={["All", "Project", "Global"]}
  typeFilters={["All", "Images", "PDFs", "Documents", "Other"]}
  showSearch={true}
  includeGrid={true}
  currentUser={currentUser}
  supabase={supabase}
/>
```

#### Mode 2: Filters Only (Custom Grid)
```astro
<MediaFilter
  sourceFilters={["All", "Mine", "Shared"]}
  typeFilters={["All", "Photos", "Videos"]}
  itemSelector=".my-custom-card"
  includeGrid={false}
/>

<div class="my-grid">
  <div class="my-custom-card" 
       data-file-name="photo.jpg"
       data-file-source="mine" 
       data-file-type="image/jpeg">
    ...
  </div>
</div>
```

## 📁 Files

### Created
```
✅ src/features/media-filter/MediaFilter.astro
✅ src/features/media-filter/README.md
```

### Modified
```
✅ src/pages/admin/media.astro (now uses MediaFilter)
```

## 🎨 Comparison with GridFilter

| Feature | GridFilter | MediaFilter |
|---------|-----------|-------------|
| Filter Style | Buttons or Dropdowns | Buttons only |
| Multi-Select | Yes | No (single per group) |
| Search | Basic | Autosuggest |
| Grid Included | No | Optional |
| Use Case | General filtering | Media files |

## 💻 Usage Examples

### Example 1: Admin Media Page (Current)
```astro
---
// src/pages/admin/media.astro
import MediaFilter from "../../features/media-filter/MediaFilter.astro";
---

<MediaFilter
  sourceFilters={["All", "Project", "Global"]}
  typeFilters={["All", "Images", "PDFs", "Documents", "Other"]}
  showSearch={true}
  minSearchChars={2}
  includeGrid={true}
  currentUser={currentUser}
  supabase={supabase}
/>
```

### Example 2: Custom Terms
```astro
<!-- Invoice manager -->
<MediaFilter
  sourceFilters={["All", "Paid", "Pending", "Overdue"]}
  typeFilters={["All", "PDF", "Excel"]}
  searchPlaceholder="Search invoices..."
/>

<!-- Photo gallery -->
<MediaFilter
  sourceFilters={["All", "Recent", "Archived"]}
  typeFilters={["All", "Photos", "Videos", "RAW"]}
  searchPlaceholder="Search photos..."
/>
```

### Example 3: In a Form
```astro
<form>
  <h3>Select Files</h3>
  
  <MediaFilter
    sourceFilters={["All", "Local", "Cloud"]}
    typeFilters={["All", "Documents", "Spreadsheets"]}
    includeGrid={false}
    itemSelector=".file-option"
  />
  
  <div class="file-list">
    <label class="file-option" 
           data-file-source="local" 
           data-file-type="application/pdf"
           data-file-name="report.pdf">
      <input type="checkbox" name="files[]" value="1">
      <span>report.pdf</span>
    </label>
  </div>
</form>
```

## 🔧 Required Data Attributes

For the filters to work, your items need these attributes:

```html
<div class="file-card"
     data-file-name="document.pdf"     <!-- Required for search -->
     data-file-source="project"        <!-- Required for source filter -->
     data-file-type="application/pdf"  <!-- Required for type filter -->
     data-file-id="123"                <!-- Optional (for delete) -->
     data-file-url="https://..."       <!-- Optional (for copy) -->
     data-project-id="456">            <!-- Optional (for display) -->
  ...
</div>
```

## 🎯 Filter Logic

### Source Filter
```javascript
source = "all"     → Show all items
source = "project" → Show only data-file-source="project"
source = "global"  → Show only data-file-source="global"
```

### Type Filter
```javascript
type = "all"       → Show all items
type = "images"    → Show data-file-type starting with "image/"
type = "pdfs"      → Show data-file-type containing "pdf"
type = "documents" → Show data-file-type with "word", "document", "excel"
type = "other"     → Show items not matching above
```

### Search Filter
```javascript
if (searchTerm.length >= 2) {
  show = data-file-name includes searchTerm
}
```

## 🎨 Customization

### Custom Input Styling
```astro
<MediaFilter
  globalInputClasses="rounded-full border-2 border-purple-500 p-4"
  searchPlaceholder="Find your files..."
/>
```

### Custom Filter Terms
```astro
<MediaFilter
  sourceFilters={["All", "Team A", "Team B", "Team C"]}
  typeFilters={["All", "Reports", "Presentations", "Spreadsheets"]}
/>
```

### Min Search Characters
```astro
<MediaFilter
  minSearchChars={3}  <!-- Wait for 3 characters before filtering -->
/>
```

## 📊 Search Behavior

| Characters | Behavior |
|------------|----------|
| 0-1 chars  | No filtering, no suggestions |
| 2+ chars   | **Start filtering**, show suggestions |
| Exact match| Hide suggestions (no need to show) |
| No matches | Hide suggestions dropdown |

## 🎹 Keyboard Shortcuts

### In Search Input
- **Arrow Down**: Move to next suggestion
- **Arrow Up**: Move to previous suggestion
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown

### General
- **Tab**: Navigate between filters
- **Space/Enter**: Activate button filters

## 🎭 Visual States

### Filter Buttons
```
Normal:    border-buffer text-heading
Active:    border-brand text-fg-brand
Hover:     border-default
Focus:     ring-4 focus:ring-gray-tertiary
```

### Search Input
```
Normal:    border-gray-300
Focus:     border-primary-500 ring-primary-500
Dark Mode: border-gray-600 bg-gray-700
```

## ⚡ Performance

- **Client-Side Only**: No server calls for filtering
- **Lazy Loading**: Images load as they appear
- **Efficient DOM**: Only shows/hides elements
- **Cached Suggestions**: Built once, filtered on demand
- **Debounced**: Optimized for fast typing

## 📱 Mobile Responsive

- **Search**: Full width on small screens
- **Filters**: Stack vertically on mobile
- **Grid**: 2 columns on mobile, all 1x1 size
- **Touch**: Large tap targets (44px min)

## 🎯 Best Practices

1. **Use Clear Labels**: "Images" not "IMG", "Project Files" not "PF"
2. **Logical Grouping**: Related filters in same group
3. **Appropriate Min Chars**: 2-3 works best for search
4. **Consistent Naming**: Match filter labels to data values
5. **Test Mobile**: Ensure touch targets are accessible

## 🐛 Troubleshooting

### Filters Not Working
- ✅ Check `data-file-source` and `data-file-type` exist
- ✅ Verify `itemSelector` matches your cards
- ✅ Ensure filter values are lowercase in data attributes

### Search Not Showing
- ✅ Check you've typed 2+ characters
- ✅ Verify `data-file-name` exists on cards
- ✅ Make sure `showSearch={true}`

### Autosuggest Not Working
- ✅ Wait 500ms after page load (suggestions build)
- ✅ Check console for "Built X suggestions" message
- ✅ Verify filenames are present

## 🚀 Next Steps

1. **Test the filters** on admin/media page
2. **Try custom terms** for different use cases
3. **Use in forms** for file selection
4. **Create variants** for different content types

---

**Status**: ✅ Complete & Ready  
**Build**: Successful  
**Location**: `src/features/media-filter/MediaFilter.astro`  
**Usage**: Drop in anywhere with props
