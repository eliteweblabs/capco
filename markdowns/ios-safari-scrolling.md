# iOS Safari Scrolling

Notes on what can affect scrolling on iOS Safari and what this project does.

## Fixes applied in codebase

- **Body scroll lock**: Avoid `touch-action: none` on `document.body` when locking for modals/sidebars. It can leave iOS Safari in a state where scrolling is broken after the overlay closes. Use `overflow: hidden` only (e.g. `ToggleSidebar.astro`).
- **Fixed bottom bars**: Use `padding-bottom: env(safe-area-inset-bottom)` (or `pb-[env(safe-area-inset-bottom)]`) so the bar sits above the home indicator (e.g. `StickyActions.astro`).
- **Layout-centered mobile** (`global.css`): Single scroll container (body overflow hidden, `main` has `overflow-y: auto` and `-webkit-overflow-scrolling: touch`) to avoid double-scroll on iOS.
- **Overscroll**: `overscroll-behavior-y: none` on html/body under `@supports (-webkit-touch-callout: none)` keeps the fixed navbar from sliding with rubber-band; optional if you want rubber-band back.

## Things to avoid

- **Document-level `touchmove` + `preventDefault()`** unless you are in a drag gesture and guard by a flag (e.g. PDFSystem tooltip drag). Otherwise it blocks page scroll.
- **`touch-action: none` on body** when locking for overlays; prefer `overflow: hidden` only.
- **Relying only on `100vh`** on iOS (address bar changes height); use `100dvh` with a `100vh` fallback where full viewport height is needed.

## Optional improvements

- **Modal scroll lock**: `window.lockBodyScroll` in App.astro only sets `overflow: hidden`. On iOS, adding `position: fixed` and `top: -scrollY` on body (and restoring on unlock) can make background scroll lock more reliable; see `src/lib/ux-utils.ts` `lockBodyScroll` for a fuller pattern (avoid changing viewport `user-scalable` for accessibility).
