# Dropzone Consolidation

## Summary

Successfully consolidated all dropzone implementations to use the shared `Dropzone.astro` component for consistency and maintainability.

## Changes Made

### 1. FileManager.astro (Files Tab)

**Before:**
- Custom dropzone HTML with manual styling
- Manual drag-and-drop event handlers
- Custom file input with click handlers
- Animated diagonal stripes background
- Inconsistent appearance with other dropzones

**After:**
- Uses shared `Dropzone.astro` component
- Listens to `dropzone-files-selected` event
- Consistent styling and behavior
- Removed custom CSS for animated stripes
- Added error handling via `dropzone-error` event

**Key Changes:**
```astro
<!-- Old -->
<div id="upload-dropzone" class="mb-6 cursor-pointer...">
  <div id="browse-files-btn" class="space-y-4">
    <Button icon="folder-open" iconPosition="left" variant="outline">
      Browse Files
    </Button>
  </div>
  <input type="file" id="file-input" multiple accept={allowedFileTypes.join(",")} class="hidden" />
</div>

<!-- New -->
<div id="file-manager-dropzone-container" class="mb-6">
  <Dropzone
    id="file-manager-dropzone"
    accept={allowedFileTypes.join(",")}
    multiple={true}
    maxSize={50}
    label="Drop files here or click to browse"
    description="Upload supports PDF, images, CAD files, and documents (max 50MB each)"
  />
</div>
```

**JavaScript Updates:**
```javascript
// Old: Manual event handlers for clicks, drag/drop
browseBtn?.addEventListener("click", (e) => { ... });
uploadArea?.addEventListener("dragover", (e) => { ... });
uploadArea?.addEventListener("drop", (e) => { ... });
fileInput?.addEventListener("change", (e) => { ... });

// New: Listen to Dropzone component events
dropzone.addEventListener("dropzone-files-selected", (e) => {
  const files = Array.from(e.detail.files);
  if (files.length > 0) {
    handleFileUpload(files);
  }
});

dropzone.addEventListener("dropzone-error", (e) => {
  showError(e.detail.error);
});
```

### 2. ProjectForm.astro (Project Form PDF Dropzone)

**Status:** Already using `Dropzone.astro` component ✅

**Configuration:**
```astro
<Dropzone
  id="project-form-pdf-dropzone"
  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
  maxSize={50}
  label="Drop PDF here or click to browse"
  description="Supported: PDF, DOC, DOCX, JPG, PNG, GIF"
  required={false}
/>
```

## Benefits

### Consistency
- ✅ Both dropzones now have identical appearance
- ✅ Same hover states and drag-over effects
- ✅ Consistent icons and messaging
- ✅ Unified dark mode support

### Maintainability
- ✅ Single source of truth for dropzone behavior
- ✅ Bug fixes apply to all dropzones
- ✅ Feature additions benefit all implementations
- ✅ Reduced code duplication

### Features
- ✅ Built-in file type validation
- ✅ File size validation (50MB max)
- ✅ Multiple file upload support
- ✅ Drag and drop functionality
- ✅ Click to browse
- ✅ Accessible (keyboard navigation)
- ✅ Error handling and user feedback

## Shared Dropzone Component

**Location:** `src/components/common/Dropzone.astro`

**Props:**
- `id` - Unique identifier for the dropzone
- `accept` - File types to accept (e.g., ".pdf,.jpg")
- `multiple` - Allow multiple file selection
- `maxSize` - Maximum file size in MB
- `label` - Main label text
- `description` - Helper text description
- `required` - Whether file selection is required
- `disabled` - Disable the dropzone
- `class` - Additional CSS classes

**Events:**
- `dropzone-files-selected` - Fired when files are selected
  - `detail.files` - FileList of selected files
  - `detail.dropzoneId` - ID of the dropzone that fired the event
- `dropzone-error` - Fired when validation fails
  - `detail.error` - Error message
  - `detail.dropzoneId` - ID of the dropzone that fired the event

## Testing Checklist

- [ ] FileManager dropzone accepts files via click
- [ ] FileManager dropzone accepts files via drag-and-drop
- [ ] ProjectForm dropzone accepts files via click
- [ ] ProjectForm dropzone accepts files via drag-and-drop
- [ ] File type validation works correctly
- [ ] File size validation works correctly
- [ ] Multiple file upload works in FileManager
- [ ] Single file upload works in ProjectForm
- [ ] Dark mode displays correctly
- [ ] Error messages display properly
- [ ] Upload progress shows correctly

## Files Modified

1. `src/components/project/FileManager.astro`
   - Added `Dropzone` import
   - Replaced custom dropzone HTML with `Dropzone` component
   - Updated JavaScript to use component events
   - Removed custom CSS styles

2. `src/components/project/ProjectForm.astro`
   - No changes needed (already using Dropzone component)

## Implementation Details

### FileManager Upload Flow

1. User selects files (click or drag-and-drop)
2. `Dropzone` component validates files (type, size)
3. `dropzone-files-selected` event fires
4. `handleFileUpload()` function processes files
5. Files are uploaded to Supabase
6. Progress bar updates
7. File list refreshes

### ProjectForm Upload Flow

1. User selects PDF file
2. `Dropzone` component validates file
3. `dropzone-files-selected` event fires
4. PDF viewer displays the file
5. User can extract text from PDF
6. Form submission includes the file

## Future Enhancements

- Add file preview thumbnails
- Add drag-and-drop reordering
- Add batch file operations
- Add file compression before upload
- Add image optimization
- Add progress indicators for individual files
