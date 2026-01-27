# Modal System Documentation

A comprehensive modal/dialog system for the application, similar to the `showNotice()` notification system but for full-featured modal dialogs.

## Overview

The modal system provides two ways to create modals:

1. **Component-based**: Use the `PageEditorModal.astro` component
2. **Programmatic**: Use the global `window.showModal()` function

Both approaches are built on Flowbite modal patterns and share consistent styling and behavior.

## Quick Start

### 1. Component Usage

```astro
---
import PageEditorModal from "@/components/ui/PageEditorModal.astro";
---

<PageEditorModal id="my-modal" />

<button data-modal-toggle="my-modal">
  Open Modal
</button>
```

### 2. Global Function Usage

```javascript
// Make sure modal-global.ts is imported in your layout
window.showModal({
  title: "Edit Page",
  body: "<p>Modal content here</p>",
  primaryButtonText: "Save",
  onConfirm: () => console.log("Confirmed!"),
  size: "large"
});
```

## Installation

### Step 1: Import Modal Functions Globally

Add to your main layout file (e.g., `LayoutBase.astro` or `App.astro`):

```astro
---
import "@/lib/modal-global";
---
```

### Step 2: Use the Component (Optional)

If you prefer static modals, import the component:

```astro
---
import PageEditorModal from "@/components/ui/PageEditorModal.astro";
---
```

## API Reference

### `window.showModal(options)`

Creates and displays a modal dialog.

#### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | `"dynamic-modal"` | Unique identifier for the modal |
| `title` | `string` | *required* | Modal title text |
| `body` | `string \| HTMLElement` | *required* | Modal body content (HTML string or DOM element) |
| `primaryButtonText` | `string` | `"Confirm"` | Text for primary action button |
| `secondaryButtonText` | `string` | `"Cancel"` | Text for cancel button |
| `onConfirm` | `() => void \| Promise<void>` | `undefined` | Callback function when confirm is clicked |
| `onCancel` | `() => void` | `undefined` | Callback function when cancel is clicked |
| `showFooter` | `boolean` | `true` | Whether to show the footer with buttons |
| `size` | `"small" \| "medium" \| "large" \| "xlarge"` | `"large"` | Modal width size |
| `closeOnBackdrop` | `boolean` | `true` | Close modal when backdrop is clicked |
| `closeOnEscape` | `boolean` | `true` | Close modal when ESC key is pressed |

#### Size Reference

- `small`: `max-w-md` (~448px)
- `medium`: `max-w-2xl` (~672px)
- `large`: `max-w-4xl` (~896px)
- `xlarge`: `max-w-7xl` (~1280px)

### `window.hideModal(modalId)`

Hides a modal by its ID.

```javascript
window.hideModal("my-modal");
```

### `window.removeModal(modalId)`

Removes a modal from the DOM entirely.

```javascript
window.removeModal("my-modal");
```

## Common Use Cases

### 1. Simple Confirmation Dialog

```javascript
window.showModal({
  title: "Confirm Action",
  body: "<p>Are you sure you want to proceed?</p>",
  primaryButtonText: "Yes, Continue",
  secondaryButtonText: "Cancel",
  size: "small",
  onConfirm: () => {
    console.log("User confirmed");
    // Perform action
  },
  onCancel: () => {
    console.log("User cancelled");
  }
});
```

### 2. Form Modal

```javascript
window.showModal({
  title: "Edit User",
  body: `
    <form id="edit-user-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Name</label>
        <input type="text" name="name" class="w-full p-2 border rounded" required />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Email</label>
        <input type="email" name="email" class="w-full p-2 border rounded" required />
      </div>
    </form>
  `,
  primaryButtonText: "Save Changes",
  size: "medium",
  onConfirm: async () => {
    const form = document.getElementById("edit-user-form");
    const formData = new FormData(form);
    
    const response = await fetch("/api/users/update", {
      method: "POST",
      body: formData
    });
    
    if (response.ok) {
      window.showNotice("success", "User Updated", "Changes saved successfully");
    }
  }
});
```

### 3. Information Display (No Footer)

```javascript
window.showModal({
  title: "Project Details",
  body: `
    <div class="space-y-4">
      <p><strong>Status:</strong> Active</p>
      <p><strong>Owner:</strong> John Doe</p>
      <p><strong>Created:</strong> 2024-01-15</p>
    </div>
  `,
  showFooter: false,
  size: "medium"
});
```

### 4. Dynamic Content with Event Handlers

```javascript
// Create dynamic content
const container = document.createElement("div");
container.innerHTML = `
  <div class="space-y-4">
    <p>Select an option:</p>
    <button id="option-a" class="px-4 py-2 bg-blue-500 text-white rounded">
      Option A
    </button>
    <button id="option-b" class="px-4 py-2 bg-green-500 text-white rounded">
      Option B
    </button>
    <p id="selection" class="text-sm text-gray-600"></p>
  </div>
`;

window.showModal({
  title: "Choose an Option",
  body: container,
  size: "medium",
  showFooter: false
});

// Add event listeners after modal is shown
setTimeout(() => {
  document.getElementById("option-a")?.addEventListener("click", () => {
    document.getElementById("selection").textContent = "You selected Option A";
  });
  
  document.getElementById("option-b")?.addEventListener("click", () => {
    document.getElementById("selection").textContent = "You selected Option B";
  });
}, 100);
```

### 5. Async Confirmation with Loading State

```javascript
window.showModal({
  title: "Delete Item",
  body: "<p>This action cannot be undone. Are you sure?</p>",
  primaryButtonText: "Delete",
  size: "small",
  onConfirm: async () => {
    const btn = document.getElementById("dynamic-modal-confirm-btn");
    const originalText = btn.textContent;
    
    // Show loading state
    btn.disabled = true;
    btn.textContent = "Deleting...";
    
    try {
      await fetch(`/api/items/${itemId}`, { method: "DELETE" });
      window.showNotice("success", "Deleted", "Item deleted successfully");
    } catch (error) {
      window.showNotice("error", "Error", "Failed to delete item");
      throw error; // Prevents modal from closing
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
});
```

## Page Editor Modal Component

The `PageEditorModal.astro` component is a pre-built modal specifically designed for page editing, but can be used as a template for any modal.

### Props

- `id` (optional): Modal ID, defaults to `"page-editor-modal"`

### Example

```astro
---
import PageEditorModal from "@/components/ui/PageEditorModal.astro";
---

<PageEditorModal id="edit-page-modal" />

<button data-modal-toggle="edit-page-modal">
  Edit Page
</button>

<script>
  // Customize modal content dynamically
  document.querySelector('[data-modal-toggle="edit-page-modal"]')
    .addEventListener('click', () => {
      const titleEl = document.getElementById("edit-page-modal-title");
      const bodyEl = document.getElementById("edit-page-modal-body");
      
      titleEl.textContent = "Edit Page Content";
      bodyEl.innerHTML = `<form>...</form>`;
    });
</script>
```

## Features

### ✅ Body Scroll Lock

When a modal opens, body scrolling is automatically locked to prevent background scrolling. This is especially important for Safari iOS.

```javascript
// Automatically called when modal opens
lockBodyScroll();

// Automatically called when modal closes
unlockBodyScroll();
```

### ✅ Keyboard Support

- **ESC key**: Close modal (can be disabled with `closeOnEscape: false`)
- **Tab navigation**: Focus trap within modal (future enhancement)

### ✅ Backdrop Click

Click outside the modal to close it (can be disabled with `closeOnBackdrop: false`)

### ✅ Accessibility

- ARIA attributes (`aria-hidden`, `tabindex`)
- Semantic HTML structure
- Focus management
- Screen reader compatible

### ✅ Dark Mode Support

Modal automatically adapts to dark mode using Tailwind's dark mode classes.

## TypeScript Support

Full TypeScript definitions are available in `src/lib/ux-utils.ts`:

```typescript
import { showModal, hideModal, removeModal } from "@/lib/ux-utils";

showModal({
  title: "My Modal",
  body: "<p>Content</p>",
  // TypeScript will provide autocomplete and type checking
});
```

## Integration with Existing Code

### Replace Old Modal Patterns

**Before:**
```javascript
const modal = document.getElementById("my-modal");
modal.classList.remove("hidden");
modal.classList.add("flex");
```

**After:**
```javascript
window.showModal({
  title: "My Modal",
  body: modalContent
});
```

### Works with showNotice()

Combine modals with notifications:

```javascript
window.showModal({
  title: "Submit Form",
  body: formHTML,
  onConfirm: async () => {
    const result = await submitForm();
    
    window.showNotice(
      "success",
      "Form Submitted",
      "Your form has been submitted successfully",
      3000
    );
  }
});
```

## Best Practices

1. **Use unique IDs**: When creating multiple modals, use unique IDs to avoid conflicts
2. **Clean up listeners**: The system handles cleanup automatically, but be mindful of custom event listeners
3. **Error handling**: Always wrap async operations in try-catch blocks
4. **Loading states**: Show loading indicators during async operations
5. **Accessibility**: Ensure interactive elements are keyboard accessible
6. **Mobile**: Test on mobile devices, especially Safari iOS

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Safari iOS (with scroll lock fixes)
- ✅ Mobile browsers

## Files

### Components
- `/src/components/ui/PageEditorModal.astro` - Reusable modal component

### Scripts
- `/src/lib/ux-utils.ts` - Core modal functions
- `/src/lib/modal-global.ts` - Global window bindings

### Examples
- `/flowbite-examples/flowbite-modal.astro` - Original Flowbite example
- `/flowbite-examples/modal-system-demo.astro` - Interactive demo page

### Documentation
- `/markdowns/modal-system.md` - This file

## Demo

To see the modal system in action, visit:
```
/flowbite-examples/modal-system-demo
```

## Troubleshooting

### Modal doesn't appear

1. Check that `modal-global.ts` is imported in your layout
2. Verify the modal ID is unique
3. Check browser console for errors

### Modal appears but content is empty

Make sure you're passing valid HTML or a DOM element to the `body` property.

### Backdrop click doesn't close modal

This is by design if `closeOnBackdrop: false` is set. Check your options.

### Body scroll still works when modal is open

The scroll lock uses `lockBodyScroll()` from `ux-utils.ts`. Make sure this file is imported properly.

## Future Enhancements

- [ ] Focus trap implementation
- [ ] Animation options
- [ ] Multiple modal stacking
- [ ] Draggable modals
- [ ] Resizable modals
- [ ] Modal templates library
- [ ] Better mobile optimizations

## Support

For questions or issues, check the demo page or review the source code in:
- `src/lib/ux-utils.ts`
- `src/components/ui/PageEditorModal.astro`
