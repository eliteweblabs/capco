# Gray CSS Variables – Required, Do Not Remove

## Protected Code

The following **`--color-gray-*`** CSS custom properties in `scripts/generate-colors.js` and `src/styles/colors.css` are **REQUIRED** and must NOT be removed:

```css
--color-gray-50 through --color-gray-950
```

## Why They Exist

- **Dropdown.astro** uses `var(--color-gray-200)` and `var(--color-gray-700)` for tooltip/popover arrow borders
- **Flowbite** and other components may reference `--color-gray-*` vars
- Tailwind class names like `border-gray-200` map to these vars in some configurations

## Problem History

The color generator outputs `--color-neutral-*` but NOT `--color-gray-*`. Components reference `--color-gray-*`, causing "variable is not defined" errors. This has reoccurred multiple times when the gray vars were removed or never added to the generator.

## Fix

`scripts/generate-colors.js` must include BOTH:
1. `--color-neutral-*` (for semantic neutral naming)
2. `--color-gray-*` (aliases – required by Dropdown, Flowbite, etc.)

When editing the color generator, **preserve the gray alias block**. Do not remove it "because we have neutral" – both are needed.
