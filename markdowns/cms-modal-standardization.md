# CMS Modal Standardization (Updated with Slot)

**Date**: February 2, 2026  
**File**: `src/pages/admin/cms.astro`  
**Change**: Migrated custom modal implementation to standardized Modal component with slot

## Problem

The CMS page had a custom modal implementation with manual overlay management:

```html
<div id="page-editor-modal" class="hidden fixed inset-0 overflow-y-auto h-full w-full z-[10050]">
  <div id="page-editor-modal-content" class="relative top-20 mx-auto p-5 border...">
    <!-- Modal content -->
  </div>
</div>
```

This approach:

- Created inconsistency across the codebase
- Made modal management harder to maintain
- Duplicated backdrop/overlay logic
- Required manual z-index and styling management

## Solution Evolution

### Phase 1: Separated Backdrop and Content

Initially migrated to use Modal component as backdrop only, with separate content container.

### Phase 2: Slot-Based Approach (Current)

Refactored Modal component to accept content via `<slot>`, making it more intuitive and self-contained:

```html
<Modal id="page-editor-modal" zIndex="{10050}" blurAmount="md" opacity="50">
  <div
    class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 pointer-events-auto"
  >
    <!-- Modal content -->
  </div>
</Modal>
```

### Modal Component Structure

The Modal component now renders:

1. **Backdrop element** with id={id} (e.g., `page-editor-modal`)
2. **Content wrapper** with id={id}-content (e.g., `page-editor-modal-content`)
3. **Automatic z-index layering** (content gets backdrop zIndex + 1)

### JavaScript Pattern

```javascript
const modalBackdrop = document.getElementById("page-editor-modal");
const modalContent = document.getElementById("page-editor-modal-content");

// Show modal
modalBackdrop.classList.remove("hidden");
modalContent.classList.remove("hidden");

// Hide modal
modalBackdrop.classList.add("hidden");
modalContent.classList.add("hidden");
```

## Benefits

1. **Slot-based content**: More intuitive, follows Astro component patterns
2. **Self-contained**: Everything in one component tag
3. **Automatic z-index**: Content automatically layered above backdrop
4. **Consistency**: Uses the same Modal component as other parts of the app
5. **Maintainability**: Central modal styling and behavior
6. **Flexibility**: Easy to adjust backdrop blur, opacity, z-index via props
7. **Cleaner Code**: Removes duplicate backdrop logic

## Modal Component Props

- `id`: Unique identifier (auto-generates `{id}-content` for wrapper)
- `zIndex`: Z-index value (default: 9999, content gets zIndex + 1)
- `blurAmount`: "none" | "sm" | "md" | "lg" | "xl" (default: "sm")
- `opacity`: Background opacity as string, e.g., "20" for 0.20 (default: "20")
- `mobileOnly`: Only show on mobile devices (default: false)
- `backdropClasses`: Additional CSS classes for backdrop
- `contentClasses`: Additional CSS classes for content wrapper

## Related Files

- Component: `src/components/ui/Modal.astro`
- Usage: `src/pages/admin/cms.astro`
- Rule: `.cursor/rules/modal-component.mdc`
- Similar patterns exist in:
  - `src/components/common/NotificationsModal.astro`
  - `src/pages/project/[id]/generate-pdf.astro`
  - `src/features/NodesCapco.astro`
  - `src/components/common/FeedbackPanel.astro`
  - And others (14 files total)

## Future Work

Consider migrating other custom modal implementations to use the standardized slot-based Modal component for consistency.
