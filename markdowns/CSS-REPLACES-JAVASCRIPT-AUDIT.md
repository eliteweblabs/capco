# CSS Replaces JavaScript Audit

**IMPLEMENTATION COMPLETE (Feb 2025)** – All major migrations done. See summary at end.

**Goal**: Identify reusable components (tooltips, dropdowns, accordions, etc.) where modern CSS/HTML can replace JavaScript, reducing framework load time and complexity.

**Scope**: Reusable components on every page, not one-offs (e.g. PDF viewer).

---

## Executive Summary

| Component | Current | CSS/HTML Replacement | Effort | Impact |
|-----------|---------|----------------------|--------|--------|
| **Tooltips** | @floating-ui/dom + JS | Popover API or `title` | Medium | High – tooltips on every page |
| **Dropdowns** (auth, notifications) | Flowbite/Popper | Popover API | Medium | High – header on every page |
| **Accordions** (FAQ, sidebar nav, Accordion.astro) | Flowbite/JS | `<details>` + `<summary>` + `name` | Low | Medium – multiple pages |
| **Speed Dial** | Custom JS (~150 lines) | Popover API + existing CSS stagger | Medium | Medium – FAB on every page |
| **Drawer** | Flowbite | Popover API | Low | Low – used sparingly |
| **CloseButton tooltip** | Tooltip.astro | `title` attribute | Trivial | Low |

---

## 1. Tooltips (`src/components/ui/Tooltip.astro`)

### Current Implementation
- **@floating-ui/dom** for viewport-aware positioning (flip, shift, offset, arrow)
- ~240 lines of JS: hover/click handlers, mobile tap-to-toggle, scroll/resize listeners
- Used by: CloseButton, IconTooltip4Block, SpeedDial items, project list icons, many admin actions

### CSS Replacement: Popover API

**Popover API** (Chrome 116+, Safari 17+, Firefox 125+, ~89% support as of Jan 2025):

```html
<button popovertarget="tooltip-1" popovertargetaction="toggle">Hover me</button>
<div id="tooltip-1" popover="auto" role="tooltip">Tooltip content</div>
```

**Benefits**:
- No positioning library (browser handles placement, though basic – not flip/shift like Floating UI)
- Click-outside dismiss built-in for `popover="auto"`
- Light dismiss, focus management, stacking (top layer) all native

**Limitations**:
- Popover API does **not** support hover-trigger natively – only `popovertargetaction="toggle"` (click). For true hover tooltips you'd need a small amount of JS or use `@media (hover: hover)` with a different pattern.
- Positioning: Popover appears in a default position. CSS Anchor Positioning (experimental) would allow tooltip-as-anchor; not yet production-ready.

**Recommendation**:
- **Simple tooltips** (e.g. icon buttons with "Close", "Delete"): Use `title` attribute – zero JS, degrades gracefully. Or Popover API with click-to-show on mobile.
- **Rich tooltips** (multi-line, formatted): Keep Floating UI for now, or adopt Popover API with a **hybrid**: `title` for basic hint, Popover for tap-to-show on touch devices.
- **MobileClickable tooltips**: Popover API is ideal – click to toggle, dismiss on outside click.

**Potential Savings**: Remove `@floating-ui/dom` dependency if all tooltips move to Popover or `title`. That’s ~3KB gzipped.

---

## 2. Dropdowns (`Dropdown.astro`, `UserDropdown.astro`, `NotificationsDropdown.astro`)

### Current Implementation
- **Flowbite** popover (Popper.js under the hood) for positioning
- `data-popover-target` / `data-dropdown-toggle` on trigger, panel gets positioned
- Dropdown.astro has inline JS for auth-icon-close (X when open) and MutationObserver

### CSS Replacement: Popover API

```html
<button popovertarget="account-dropdown" popovertargetaction="toggle">
  Account
</button>
<div id="account-dropdown" popover="auto" role="menu">
  <!-- dropdown content -->
</div>
```

**Benefits**:
- No Flowbite/Popper for dropdown logic
- Top-layer stacking, light dismiss, focus handling all built-in
- `popovertargetaction="toggle"` gives click-to-open/close

**Caveats**:
- Flowbite still does **positioning** (anchored to trigger). Popover API by default shows centered. For dropdowns that need to align under the trigger, you’d need:
  - **CSS Anchor Positioning** (Chrome 125+, experimental) – `anchor-name`, `position: fixed; position-area: ...`
  - Or a small amount of JS to set `top`/`left` when opening (much simpler than full Popper)

**Recommendation**:
- **High**: Replace Flowbite dropdown/popover with Popover API for AuthIcon, UserDropdown, NotificationsDropdown.
- Use CSS Anchor Positioning when widely supported, or minimal JS to set position on `popoverinvoke` event.
- **Flowbite** could still be loaded for modal/drawer if needed, or removed if those move to Popover too.

---

## 3. Accordions (`FAQBlock`, `Accordion.astro`, `Aside.astro` sidebar collapse)

### Current Implementation
- **FAQBlock**: `data-accordion="collapse"`, `data-accordion-target`, Flowbite init + custom JS
- **Accordion.astro**: Custom script toggles `hidden`, updates `aria-expanded`, rotates icon
- **Aside**: `data-collapse-toggle`, `data-sidebar-collapse-*` – Flowbite collapse

### CSS Replacement: `<details>` + `<summary>` + `name`

**100% no JavaScript:**

```html
<!-- Single item -->
<details>
  <summary>Section title</summary>
  <p>Content here.</p>
</details>

<!-- Exclusive accordion (only one open) -->
<details name="faq-accordion">
  <summary>Question 1?</summary>
  <p>Answer 1.</p>
</details>
<details name="faq-accordion">
  <summary>Question 2?</summary>
  <p>Answer 2.</p>
</details>
```

**Browser support**: `name` for exclusive accordions is stable in Chrome 120+, Safari 17.2+, Firefox 130+.

**Styling**:
- `details[open]` for expanded state
- `summary::marker` or `summary::before` for custom chevron
- `summary { list-style: none }` to hide default triangle

**Recommendation**:
- **FAQBlock**: Replace Flowbite accordion with `<details name="...">`. Remove accordion init script.
- **Accordion.astro**: Rewrite to `<details><summary>`. Remove custom toggle script.
- **Aside sidebar**: Replace `data-collapse-toggle` with `<details>` for each nav group with children. Flowbite collapse can be removed for sidebar.

**Potential Savings**: Remove Flowbite accordion/collapse init, ~50–100 lines of custom accordion JS per component.

---

## 4. Speed Dial (`SpeedDial.astro`)

### Current Implementation
- ~150 lines of JS: toggle, hover vs click, touch handling, click-outside, Escape
- Manually shows/hides tooltips with staggered delay (100ms per item)
- Stagger animation already in CSS (transition-delay)

### CSS Replacement: Popover API + CSS

- **Menu panel**: Use `popover="auto"` on `#speed-dial-menu`, `popovertarget` on trigger button.
- **Show/hide**: Browser handles open/close, click-outside, Escape.
- **Hover**: Popover is click-triggered. For hover-open on desktop, you’d need a tiny bit of JS (`mouseenter` → `showPopover()`), or accept click-only (simpler, works on all devices).
- **Stagger**: Already CSS. Ensure `.speed-dial-open` is applied when popover is open – e.g. use `:popover-open` or a class set by `toggle` event.

**Simplified approach**:
- Replace toggle/outside-click/Escape logic with Popover API.
- Keep minimal JS for: (1) hover-to-open on `(hover: hover)` if desired, (2) applying `.speed-dial-open` when popover opens (or use `popover:open` in CSS if supported).
- Tooltips inside: When menu is open, optionally force-visible via CSS (e.g. `.speed-dial-menu:popover-open .tooltip-content { opacity: 1 }`) if using a shared Tooltip; or switch to `title` for these simple labels.

**Recommendation**:
- Replace most Speed Dial JS with Popover API.
- Keep small script only for hover-to-open and any tooltip behavior if needed.

---

## 5. Drawer (`Drawer.astro`, FlowbiteDrawer)

### Current Implementation
- Flowbite `data-drawer-*` for show/hide and placement
- Slide-in animation via CSS

### CSS Replacement: Popover API

- Use `popover="auto"` on the drawer panel.
- Trigger: `popovertarget` on open button.
- Placement (left/right) via CSS `transform` and `inset` – same as now.
- Popover gives light dismiss and top-layer stacking.

**Recommendation**: Low-hanging fruit. Swap Flowbite drawer for Popover; styling stays similar.

---

## 6. CloseButton Tooltip

### Current Implementation
- Wraps button in `Tooltip.astro` for "Close" text on hover

### CSS Replacement: `title` attribute

```html
<button title="Close" aria-label="Close">...</button>
```

Native tooltip, no JS. Slightly less control over placement and styling, but sufficient for a close button.

**Recommendation**: Use `title` when `tooltip={false}` would have been used, or as default for simple close buttons.

---

## Implementation Priority

| Priority | Component | Effort | JS Removed | Notes |
|----------|-----------|--------|------------|-------|
| 1 | Accordions (FAQ, Accordion.astro, Aside) | Low | High | `<details>` is straightforward |
| 2 | CloseButton | Trivial | Low | Add `title` where appropriate |
| 3 | Drawer | Low | Medium | Popover API |
| 4 | Dropdowns | Medium | High | Popover API; may need minimal positioning |
| 5 | Speed Dial | Medium | High | Popover API + small hover script |
| 6 | Tooltips | Medium | High | Popover or `title`; Floating UI for complex cases |

---

## Dependencies That Could Be Removed or Reduced

- **Flowbite** (~2.5.2 from CDN): Used for accordion, collapse, dropdown, popover, drawer. If these move to native HTML/CSS and Popover API, Flowbite usage shrinks or is removed.
- **@floating-ui/dom**: Used only by Tooltip.astro. Removable if tooltips move to Popover API or `title`.

---

## Browser Support Considerations

- **Popover API**: ~89% global support. Consider a small polyfill (e.g. `@oddbird/popover-polyfill`) for older Safari/iOS.
- **`<details name="">`**: Chrome 120+, Safari 17.2+, Firefox 130+. Very high coverage.
- **`:has()`**: Use for parent styling when child popover is open (e.g. `button:has(+ [popover]:popover-open)`). Widely supported.

---

---

## Implementation Summary (Feb 2025)

| Component | Status | Notes |
|-----------|--------|-------|
| **Accordions** | Done | FAQBlock, Accordion.astro, Aside: now use `<details><summary>` + `name` for exclusive accordions. No JS. |
| **CloseButton** | Done | Uses native `title` attribute; added `popoverCloseTarget` for Drawer close. |
| **Drawer** | Done | Uses Popover API; PunchlistDrawerButton uses `popovertarget`; CloseButton uses `popoverCloseTarget`. |
| **Dropdowns** | Done | Dropdown.astro, AuthIcon, NotificationBellButton: Popover API; positioning script; auth-icon-close wired. |
| **Speed Dial** | Done | Menu uses `popover="auto"`; trigger uses `popovertarget`; hover script for desktop; titles for action labels. |
| **Tooltips** | Partial | Added `useNative` prop for `title`-only; migrated DeleteConfirmButton, SlotMachineModalStaff, ProjectList. |
| **Flowbite** | Kept | Still loaded for CookieBanner, Discussions, FileManager, etc. Remove when those are migrated. |

---

## References

- [Popover API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
- [Exclusive accordions with details name - MDN Blog](https://developer.mozilla.org/en-US/blog/html-details-exclusive-accordions/)
- [Popover Baseline (web.dev)](https://web.dev/blog/popover-baseline)
- [CSS-Tricks: Poppin' In](https://css-tricks.com/poppin-in/)
