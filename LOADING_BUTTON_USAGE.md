# LoadingButton Component Usage

The `LoadingButton` component provides a reusable button with built-in loading spinner functionality.

## Basic Usage

```astro
---
import LoadingButton from "../components/common/LoadingButton.astro";
---

<!-- Basic button -->
<LoadingButton> Save Project </LoadingButton>

<!-- With custom properties -->
<LoadingButton id="save-btn" variant="primary" size="md" loadingText="Saving...">
  Save Project
</LoadingButton>
```

## Props

| Prop          | Type                                                                     | Default      | Description                             |
| ------------- | ------------------------------------------------------------------------ | ------------ | --------------------------------------- |
| `id`          | string                                                                   | undefined    | Button ID for targeting with JavaScript |
| `type`        | "button" \| "submit" \| "reset"                                          | "button"     | HTML button type                        |
| `variant`     | "primary" \| "secondary" \| "success" \| "danger" \| "warning" \| "info" | "primary"    | Button color theme                      |
| `size`        | "sm" \| "md" \| "lg"                                                     | "md"         | Button size                             |
| `disabled`    | boolean                                                                  | false        | Whether button is disabled              |
| `loading`     | boolean                                                                  | false        | Whether button shows loading state      |
| `loadingText` | string                                                                   | "Loading..." | Text shown during loading               |
| `class`       | string                                                                   | ""           | Additional CSS classes                  |
| `onclick`     | string                                                                   | undefined    | Inline click handler                    |

## Variants

```astro
<LoadingButton variant="primary">Primary Button</LoadingButton>
<LoadingButton variant="secondary">Secondary Button</LoadingButton>
<LoadingButton variant="success">Success Button</LoadingButton>
<LoadingButton variant="danger">Danger Button</LoadingButton>
<LoadingButton variant="warning">Warning Button</LoadingButton>
<LoadingButton variant="info">Info Button</LoadingButton>
```

## Sizes

```astro
<LoadingButton size="sm">Small Button</LoadingButton>
<LoadingButton size="md">Medium Button</LoadingButton>
<LoadingButton size="lg">Large Button</LoadingButton>
```

## JavaScript Control

Use the global `setButtonLoading` function to control loading state:

```javascript
// Set loading state
window.setButtonLoading("my-button", true, "Updating Status...");

// Clear loading state (you'll need to restore original content)
window.setButtonLoading("my-button", false);
```

## Real-world Examples

### Form Submit Button

```astro
<LoadingButton id="submit-form-btn" type="submit" variant="primary" loadingText="Submitting...">
  Submit Form
</LoadingButton>

<script>
  document.getElementById("my-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Set loading state
    window.setButtonLoading("submit-form-btn", true, "Submitting...");

    try {
      // Your API call here
      await fetch("/api/submit-form", { method: "POST" });
    } finally {
      // Clear loading state
      window.setButtonLoading("submit-form-btn", false);
    }
  });
</script>
```

### Status Update Button

```astro
<LoadingButton
  id="update-status-btn"
  variant="success"
  loadingText="Updating Status..."
  onclick="updateProjectStatus()"
>
  Mark Complete
</LoadingButton>

<script>
  async function updateProjectStatus() {
    window.setButtonLoading("update-status-btn", true, "Updating Status...");

    try {
      const response = await fetch("/api/update-status", { method: "POST" });
      // Handle response
    } finally {
      window.setButtonLoading("update-status-btn", false);
    }
  }
</script>
```

### File Upload Button

```astro
<LoadingButton id="upload-btn" variant="info" loadingText="Uploading Files...">
  Upload Documents
</LoadingButton>
```

## Styling

The component uses Tailwind CSS classes and supports dark mode. You can add custom classes:

```astro
<LoadingButton class="w-full shadow-lg" variant="primary"> Full Width Button </LoadingButton>
```

## Features

- ✅ **Spinner Animation**: Smooth rotating spinner during loading
- ✅ **Multiple Variants**: 6 different color themes
- ✅ **Responsive Sizes**: Small, medium, and large options
- ✅ **Accessibility**: Proper disabled states and focus rings
- ✅ **Dark Mode**: Built-in dark mode support
- ✅ **TypeScript**: Full TypeScript support
- ✅ **Global Control**: JavaScript function for dynamic state management
