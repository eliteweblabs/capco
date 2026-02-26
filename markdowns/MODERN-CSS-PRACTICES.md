# Modern CSS Practices (from modern-css.com)

Reference for adopting **modern-css.com** patterns in this project. Use these instead of old hacks when writing or refactoring CSS.

**Source:** [modern-css.com](https://modern-css.com) — "Modern CSS code snippets, side by side with the old hacks they replace."

---

## Layout

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| `position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%)` | `.parent { display: grid; place-items: center; }` | Centering: child needs nothing. |
| `height: 100vh` (overflows on mobile) | `height: 100dvh` or `min-height: 100dvh` | Adapts to browser chrome. **We use this in `global.css` for body.** |
| `top: 0; right: 0; bottom: 0; left: 0` | `inset: 0` | Positioning shorthand. |
| `margin-right: 16px` + `:last-child { margin-right: 0 }` | `display: flex; gap: 16px` (or grid + gap) | Spacing without margin hacks. |
| `padding-top: 56.25%` + absolute inner | `aspect-ratio: 16 / 9` | Aspect ratios. |
| `float: left` + clearfix | `display: grid` / `grid-template-areas` | Layout without line numbers. |
| `width: calc(100% - 40px)` | `width: stretch` (where supported) | Fills container, keeps margins. |
| `@media (min-width: 600px) and (max-width: 1200px)` | `@media (600px <= width <= 1200px)` | Range syntax (readable). |
| Viewport-only responsive | `@container (width < 400px) { ... }` | Container queries for component-level responsiveness. |
| JS scroll listener for fixed header | `position: sticky; top: 0` | Sticky headers. |
| Body scroll jump when scrollbar appears | `scrollbar-gutter: stable` on scroll container | Reserve scrollbar space. **Consider on `#reveal-scroll`.** |

---

## Selectors & specificity

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| `.card h1, .card h2, .card h3, .card h4` | `.card :is(h1, h2, h3, h4)` | Grouping without repetition. |
| `:focus` (shows on mouse click too) | `:focus-visible` | Focus only for keyboard. **We use in Button, CloseButton, global.css.** |
| BEM or heavy naming | `@scope (.card) { .title { ... } }` | Scoped styles (browser support ~84%). |
| Complicated resets | `:where(ul, ol) { margin: 0; ... }` | Low-specificity resets. |
| `!important` wars | `@layer base, components, utilities` + layer order | Control specificity. |
| JS to add class based on child | `.card:has(img) { ... }` | Parent selection in CSS. |

---

## Colors & theme

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| Hardcoded light/dark duplicates | `color: light-dark(#111, #eee)` + `color-scheme: light dark` | Single declaration. |
| Manual light/dark media for form controls | `:root { color-scheme: light dark; }` | Native control theming. |
| Sass `$primary` only | `:root { --primary: #7c3aed; }` + `var(--primary)` | **We use CSS vars in colors.css.** |
| Guess-and-check shades | `oklch(0.55 0.2 264)` — change L for shades | Perceptually uniform. |
| sRGB only | `oklch()` or `color(display-p3 ...)` | Vivid colors on P3 displays. |
| Sass `mix()` | `color-mix(in oklch, #3b82f6, #ec4899)` | **We use color-mix in global.css.** |

---

## Forms & validation

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| JS to add `.touched` on blur | `input:user-invalid` / `input:user-valid` | Native validation states. |
| `appearance: none` + 20 lines custom | `accent-color: #7c3aed` for checkbox/radio | Light touch. |
| JS resize on input for textarea | `field-sizing: content; min-height: 3lh` | **We use in global.css for `.expanding-textarea`.** |

---

## Animation & motion

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| JS to detect reduced motion | `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }` | **We use in global.css for [data-animate] and buttons.** |
| Single `transform: translateX() rotate() scale()` | `translate: 10px 0; rotate: 45deg; scale: 1.2` | Animate any one independently. |
| rAF/setTimeout for entry animation | `@starting-style { opacity: 0; transform: translateY(10px); }` | Entry animations. |

---

## Typography

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| Manual line breaks for balance | `text-wrap: balance` on headings | Balanced headlines. |
| Multiple `@font-face` per weight | `font-weight: 100 900` in one `@font-face` | Variable font. |
| Invisible text until font loads | `font-display: swap` in `@font-face` | **Check fonts.css.** |
| JS truncation | `display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3` | Multiline truncation. |
| Float for drop cap | `initial-letter: 3` | Drop caps. |
| Many media queries for font-size | `font-size: clamp(1rem, 2.5vw, 2rem)` | Fluid typography. |

---

## Modals, scroll, dialogs

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| JS to block page scroll in modal | `.modal-content { overflow-y: auto; overscroll-behavior: contain; }` | Page stays still. |
| Fixed overlay + JS open/close/ESC | `<dialog>` + `::backdrop` | Native modal. **Use where possible.** |
| Webkit-only scrollbar styling | `scrollbar-width: thin; scrollbar-color: #888 transparent` | Standard scrollbar. |

---

## Workflow & detection

| Avoid (old) | Prefer (modern) | Notes |
|-------------|-----------------|--------|
| Modernizr or JS feature check | `@supports (display: grid) { .layout { display: grid; } }` | No JS. |
| Sass/Less for nesting | Native `.nav { & a { color: #888; } }` in .css | Plain CSS nesting. |

---

## Project-specific checklist

- **Already in use:** `100dvh`, `color-mix()`, `:focus-visible`, `prefers-reduced-motion`, `field-sizing: content` (expanding textarea), `inset: 0` in places, CSS variables in colors.css.
- **Apply when touching code:** `gap` instead of margin hacks, `:is()` / `:where()` for grouping, `aspect-ratio` instead of padding hack, `scrollbar-gutter: stable` on main scroll container, range media queries `(600px <= width <= 1200px)`.
- **Consider for new features:** Container queries, `<dialog>`, `@scope`, `@layer` for custom CSS, `oklch` for new color definitions, `light-dark()` for simple theme values.

---

## Quick links

- [modern-css.com](https://modern-css.com) — full list of 75+ snippets with browser support.
- Our global styles: `src/styles/global.css`, `src/styles/colors.css`, `src/styles/tailwind.css`.
