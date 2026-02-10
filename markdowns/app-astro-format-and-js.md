# App.astro: Formatting and JS Organization

## Why App.astro might not format in the editor

- **File size**: At 3000+ lines, Prettier can time out in the IDE (format-on-save). The CLI has no such limit.
- **Inline scripts**: `is:inline` and `define:vars` script blocks are emitted as-is; the Astro Prettier plugin may not format their inner JS.
- **Recommendation**: Run format from the terminal for this file:
  ```bash
  npx prettier --write "src/components/ui/App.astro"
  ```
  Or format the whole project: `npm run format`.

## Is it bad to put JS in external files?

**No.** For Astro:

- **`<script>` (no directive)**  
  Astro bundles the script and resolves `@/` and relative imports. Putting logic in `src/scripts/*.ts` and importing from App.astro is recommended: better formatting, linting, and maintainability.

- **`<script is:inline>`**  
  Not bundled; runs as-is. Use only when you need:
  - Server-injected values (`define:vars`)
  - To run before or without the bundle (e.g. theme/cookie, critical color injection).

So: move as much as possible into external `.ts` files and keep only small, necessary bits inline (theme, CMS colors, SPA page inits).

## Optimizing App.astro

- **Already external**: `init-auth-globals`, `typewriter-text`, `scroll-animations`, `lazy-load-images`, `project-item-handlers`, `button-ripple`, `modal-global`, `notification-count-loader`.
- **Extracted**: The large “globals” script block has been moved to `src/scripts/app-globals.ts` so App.astro stays shorter and the globals script can be formatted and edited in a normal TS file.
