# PDFPreview Component

A reusable Astro component for displaying PDF content with zoom controls and interactive features.

## Features

- **Zoom Controls**: Zoom in/out, reset, fit to width/page
- **Blob URL Handling**: Secure HTML content display using blob URLs
- **Responsive Design**: Adapts to different container sizes
- **Customizable Styling**: Flexible CSS classes and styling options
- **JavaScript API**: Programmatic control of the preview

## Usage

### Basic Usage

```astro
---
import PDFPreview from "../components/common/PDFPreview.astro";

const htmlContent = "<html>...</html>";
---

<PDFPreview htmlContent={htmlContent} documentName="My Document" showZoomControls={true} />
```

### Advanced Usage

```astro
<PDFPreview
  htmlContent={htmlContent}
  documentName="Custom Document"
  showZoomControls={true}
  containerClass="custom-container-class"
  iframeClass="custom-iframe-class"
  height="800px"
/>
```

## Props

| Prop               | Type      | Default                               | Description                            |
| ------------------ | --------- | ------------------------------------- | -------------------------------------- |
| `htmlContent`      | `string`  | Required                              | HTML content to display in the preview |
| `documentName`     | `string`  | `"PDF Preview"`                       | Name of the document (for debugging)   |
| `showZoomControls` | `boolean` | `true`                                | Whether to show zoom control buttons   |
| `containerClass`   | `string`  | `"overflow-auto border-0 rounded-lg"` | CSS classes for the container          |
| `iframeClass`      | `string`  | `"border-0"`                          | CSS classes for the iframe             |
| `height`           | `string`  | `"600px"`                             | Height of the preview container        |

## JavaScript API

The component exposes a global `window.PDFPreview` object with the following methods:

### Methods

- `setContent(htmlContent: string)` - Update the HTML content
- `zoomIn()` - Zoom in by 25%
- `zoomOut()` - Zoom out by 25%
- `resetZoom()` - Reset zoom to 100%
- `fitToWidth()` - Fit content to container width
- `fitToPage()` - Fit content to container size
- `getCurrentZoom()` - Get current zoom level
- `setZoom(zoom: number)` - Set specific zoom level (25-300%)

### Example

```javascript
// Update content
window.PDFPreview.setContent(newHtmlContent);

// Control zoom
window.PDFPreview.zoomIn();
window.PDFPreview.setZoom(150);
window.PDFPreview.fitToWidth();
```

## Styling

The component uses Tailwind CSS classes by default. You can customize the appearance by:

1. **Container Styling**: Use the `containerClass` prop
2. **Iframe Styling**: Use the `iframeClass` prop
3. **Custom CSS**: Override the component's styles

### Custom CSS Example

```css
.pdf-preview-container {
  /* Custom container styles */
}

.pdf-preview-container #zoomControls {
  /* Custom zoom control styles */
}
```

## Browser Compatibility

- Modern browsers with ES6+ support
- Requires `Blob` and `URL.createObjectURL` support
- Tested on Chrome, Firefox, Safari, Edge

## Security

- Uses blob URLs for secure content display
- Iframe sandbox prevents script execution
- Content is isolated from the parent page

## Examples

See `PDFPreviewExample.astro` for complete usage examples.
