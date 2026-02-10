# CMS Custom CSS: Footer logo (currentColor)

The footer includes a placeholder element with class **`.cms-logo-mask`**. It has no default styling in the app so no logo is hardcoded.

To show your logo in the footer (and have it follow the theme/text color), add CSS in **Admin → Settings → Custom CSS** that:

1. Defines a variable with your logo as a **mask image** (SVG with `fill="white"`, then base64- or URL-encoded).
2. Targets `.cms-logo-mask` with that mask and `background-color: currentColor`.

## Pattern (paste into CMS Custom CSS)

Replace `YOUR_LOGO_MASK_DATA_URI` with your logo SVG as a data URI. The SVG must use **white fill** for the shape (mask = white visible, transparent elsewhere). Encode the SVG as `data:image/svg+xml;base64,...` or `data:image/svg+xml,...` (URL-encoded).

```css
:root {
  --logo-mask-url: url("YOUR_LOGO_MASK_DATA_URI");
}

.cms-logo-mask {
  background-color: currentColor;
  mask-image: var(--logo-mask-url);
  -webkit-mask-image: var(--logo-mask-url);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}
```

The element is already sized in the footer (e.g. `h-8 w-[4.5rem]`). Other pages can reuse `.cms-logo-mask` with their own size classes; the color will always follow `currentColor`.
