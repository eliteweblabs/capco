# ✅ Page Editor Modal - ID Structure Confirmed

## Element IDs

The modal system now matches the existing `#page-editor-modal-content` structure from your CMS page.

### ID Pattern

For a modal with `id="page-editor-modal"`, the following IDs are available:

```
#page-editor-modal              → Main modal container
#page-editor-modal-content      → Content wrapper (white card)
#page-editor-modal-title        → Title element
#page-editor-modal-body         → Body content area
#page-editor-modal-footer       → Footer buttons area
#page-editor-modal-confirm-btn  → Primary action button
#page-editor-modal-cancel-btn   → Cancel button
```

### Compatible with Existing Code

This means your existing CSS or JavaScript that targets `#page-editor-modal-content` will work perfectly:

```javascript
// ✅ This works with both the component and showModal()
const content = document.getElementById("page-editor-modal-content");
content.style.backgroundColor = "red";

// ✅ Access the body
const body = document.getElementById("page-editor-modal-body");
body.innerHTML = "<p>New content</p>";

// ✅ Access the title
const title = document.getElementById("page-editor-modal-title");
title.textContent = "New Title";
```

### Using with window.showModal()

```javascript
window.showModal({
  id: "page-editor-modal",  // Creates all the IDs above
  title: "Edit Page",
  body: formHTML
});

// Then access elements by ID:
const content = document.getElementById("page-editor-modal-content");
```

### Using the Component

```astro
<PageEditorModal id="page-editor-modal" />
```

Creates the same ID structure.

## Summary

✅ **Yes**, it's set up for `#page-editor-modal-content`! 

The modal now includes:
- `#{id}-content` wrapper (e.g., `#page-editor-modal-content`)
- All the standard IDs for title, body, footer, and buttons
- Full compatibility with your existing CMS code
