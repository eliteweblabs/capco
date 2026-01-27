# Modal System Quick Reference

## 🚀 Quick Start

```javascript
// Simple modal
window.showModal({
  title: "My Modal",
  body: "<p>Content here</p>"
});

// With confirmation
window.showModal({
  title: "Confirm",
  body: "<p>Are you sure?</p>",
  onConfirm: () => console.log("Confirmed!")
});
```

## 📚 Common Patterns

### Confirmation Dialog
```javascript
window.showModal({
  title: "Delete Item?",
  body: "<p>This cannot be undone.</p>",
  primaryButtonText: "Delete",
  size: "small",
  onConfirm: async () => {
    await deleteItem(id);
    window.showNotice("success", "Deleted!");
  }
});
```

### Form Modal
```javascript
window.showModal({
  title: "Edit User",
  body: `<form id="user-form">
    <input type="text" name="name" />
  </form>`,
  primaryButtonText: "Save",
  onConfirm: async () => {
    const form = document.getElementById("user-form");
    const data = new FormData(form);
    await saveUser(data);
  }
});
```

### Info Display
```javascript
window.showModal({
  title: "Details",
  body: detailsHTML,
  showFooter: false
});
```

## ⚙️ Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | *required* | Modal title |
| `body` | string/Element | *required* | Content |
| `primaryButtonText` | string | "Confirm" | Primary button |
| `secondaryButtonText` | string | "Cancel" | Cancel button |
| `onConfirm` | function | - | Confirm callback |
| `onCancel` | function | - | Cancel callback |
| `showFooter` | boolean | true | Show footer |
| `size` | string | "large" | small/medium/large/xlarge |
| `closeOnBackdrop` | boolean | true | Close on backdrop click |
| `closeOnEscape` | boolean | true | Close on ESC key |

## 🎯 Size Guide

- `small` - 448px - Confirmations
- `medium` - 672px - Forms
- `large` - 896px - Default
- `xlarge` - 1280px - Full content

## 🔧 Utility Functions

```javascript
// Hide modal
window.hideModal("modal-id");

// Remove modal
window.removeModal("modal-id");
```

## ✨ Pro Tips

1. **Loading states**: Update button text during async operations
```javascript
onConfirm: async () => {
  const btn = document.getElementById("modal-id-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  await save();
}
```

2. **Prevent close on error**: Throw error in onConfirm
```javascript
onConfirm: async () => {
  const result = await save();
  if (!result.ok) {
    window.showNotice("error", "Failed");
    throw new Error("Save failed"); // Keeps modal open
  }
}
```

3. **Dynamic content**: Pass DOM elements
```javascript
const div = document.createElement("div");
div.innerHTML = `<button id="btn">Click</button>`;
window.showModal({ title: "Dynamic", body: div });
setTimeout(() => {
  document.getElementById("btn").onclick = () => alert("Hi!");
}, 100);
```

4. **Chain with showNotice**:
```javascript
onConfirm: async () => {
  await save();
  window.showNotice("success", "Saved!", null, 3000);
}
```

## 📦 Component Usage

```astro
---
import PageEditorModal from "@/components/ui/PageEditorModal.astro";
---

<PageEditorModal id="my-modal" />
<button data-modal-toggle="my-modal">Open</button>
```

## 🔗 Files

- Component: `src/components/ui/PageEditorModal.astro`
- Functions: `src/lib/ux-utils.ts`
- Global: `src/lib/modal-global.ts`
- Demo: `flowbite-examples/modal-system-demo.astro`
- Docs: `markdowns/modal-system.md`
- Examples: `flowbite-examples/modal-usage-examples.js`
