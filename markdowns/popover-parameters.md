# Popover Parameters

Popovers use Flowbite's popover (Popper.js). Use `Popover.astro` or raw Flowbite data attributes.

## Popover.astro Component

```astro
import Popover from "../components/common/Popover.astro";
```

```astro
<Popover id="my-popover" title="Popover title" placement="bottom" trigger="click">
  <button slot="trigger">Open popover</button>
  <p>And here's some amazing content. It's very engaging. Right?</p>
</Popover>
```

### Parameters

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | Unique ID for the popover (used as `data-popover-target`) |
| `placement` | `string` | `"top"` | Position: `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end` |
| `trigger` | `"click"` \| `"hover"` | `"hover"` | How to open: click or hover |
| `offset` | `number` | `10` | Distance in px from trigger |
| `showArrow` | `boolean` | `true` | Show arrow pointing at trigger |
| `title` | `string` | - | Optional header above content |
| `width` | `string` | `"w-64"` | Tailwind width: `w-64`, `w-72`, `w-80`, `w-96`, `max-w-sm`, etc. |
| `class` | `string` | - | Extra classes on popover container |
| `contentClass` | `string` | - | Extra classes on content area |

### Slots

- **trigger** (required): The element to click/hover (button, link, icon, etc.)
- **default**: The popover body content

---

## Flowbite Data Attributes (raw usage)

When using Flowbite markup directly, add these to the **trigger** element:

| Attribute | Value | Description |
|-----------|-------|-------------|
| `data-popover-target` | `"{popoverId}"` | ID of the popover div (required) |
| `data-popover-placement` | `top` \| `right` \| `bottom` \| `left` + `-start`/`-end` | Position |
| `data-popover-trigger` | `click` \| `hover` | Interaction type |
| `data-popover-offset` | number (px) | Distance from trigger |

On the popover element:

- `data-popover` – marks it as popover
- `id` – must match `data-popover-target`
- `role="tooltip"` – accessibility
- `data-popper-arrow` – optional arrow element

Example:

```html
<button data-popover-target="popover-1" data-popover-placement="bottom" data-popover-trigger="click">
  Trigger
</button>
<div data-popover id="popover-1" role="tooltip" class="...">
  <div>Content</div>
  <div data-popper-arrow></div>
</div>
```
