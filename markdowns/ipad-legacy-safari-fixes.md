# Older iPad Air / Legacy Safari Fixes

## Problem
Older iPad Air (e.g. iOS 12) may not render the site or only render some pages (e.g. `/services`) with broken layout. Likely causes added in the last ~2 weeks: modern JS syntax and heavy client scripts.

## Is it because the iPad is very old? (e.g. ~10 years)

**Yes.** A ~10-year-old iPad is typically stuck on **iOS 10, 11, or 12** (Apple stops providing OS updates after several years). That means:

- **Safari is many years behind** – it doesn’t support a lot of modern CSS and JS.
- **Styles will not look the same** – even with fallbacks, some things can’t be polyfilled:
  - **Flexbox `gap`** – not supported until Safari 14 (iOS 14). Tailwind uses `gap` everywhere. On older iOS, flex layouts have **no space between items** unless we use margin hacks (we don’t globally), so spacing will look wrong.
  - **CSS `dvh`** – we use `100vh` fallbacks, so height is usually ok.
  - **CSS `max()` / `min()`** – we added fallbacks in `global.css` so navbar and tooltips don’t break; older Safari will use the fallback value.
- **JavaScript** – we build with `es2018` so `?.` and `??` are transpiled; if the device is on iOS 10 or very old 11, other APIs (e.g. `IntersectionObserver` behavior, or something in Flowbite/AOS) can still fail or behave differently.
- **Different installs, same iPad** – if you see the same issues on another server, it’s the **device/browser**, not cache or server. Clearing cache only helps for updated JS/CSS; it doesn’t add support for missing features.

**Practical takeaway:** We can improve compatibility and avoid hard crashes (blank page), but we **cannot** make a 10-year-old iPad match the exact look and behavior of a modern browser. For critical users on very old devices, the options are: use a newer device, use a different browser on the same device if available, or we add a “simple mode” that serves a stripped-down layout (no Tailwind gap, minimal JS) when we detect very old Safari – that’s a larger project.

## Fixes Applied

### 1. Vite build target (main fix)
- **File:** `astro.config.mjs`
- **Change:** `vite.build.target: "es2018"`
- **Why:** Optional chaining (`?.`) and nullish coalescing (`??`) require Safari 13.1+ (iOS 13.4+). With `es2018`, esbuild transpiles them so older Safari can parse the bundle. Without this, the main app script can throw on load and the page stays blank.

### 2. DOMContentLoaded try/catch
- **File:** `src/components/ui/App.astro`
- **Change:** The main `DOMContentLoaded` handler is wrapped in `try { ... } catch (e) { console.error("[APP] DOMContentLoaded error (older Safari/iPad?):", e); }`
- **Why:** If any code in that handler throws (e.g. unsupported API), we log it instead of leaving the page broken. Helps isolate the failing line on device.

### 3. Legacy Safari flag and skip Safari 18 fixes
- **File:** `src/components/ui/App.astro`
- **Change:** Early inline script sets `window.__legacySafari = true` when iOS Safari version is &lt; 14. The Safari 18 beta viewport/sticky fixes block only runs when `!__legacySafari && isSafariBeta()`, so we avoid extra DOM work on old iPads.

### 4. CSS `max()` / `min()` fallbacks
- **File:** `src/styles/global.css`
- **Change:** Older Safari (pre–11.3) don’t support `max()` / `min()`. We add a fallback line before each use so the rule still applies:
  - `#main-navbar`: `top: 1rem` then `top: max(1rem, env(safe-area-inset-top, 0px))`
  - `.tooltip-content`: `max-width: 22rem` then `max-width: min(22rem, calc(100vw - 1rem))`

## What to turn off to debug (if still broken)

1. **Flowbite JS**  
   In `App.astro`, the Flowbite script is:
   ```html
   <script src="https://unpkg.com/flowbite@2.5.2/dist/flowbite.min.js"></script>
   ```
   Comment it out temporarily to see if it’s the culprit (older Safari may not support something in that bundle).

2. **AOS (animate on scroll)**  
   Near the bottom of `App.astro`:
   ```html
   <script src="https://unpkg.com/aos@2.3.1/dist/aos.js" defer></script>
   ```
   Comment it out to rule out AOS as the cause.

3. **Safari viewport / sticky fixes**  
   Already skipped when `__legacySafari` is set. If you need to disable for all Safari, guard the block that calls `isSafariBeta()` so it never runs (e.g. force `isSafariBeta = false`).

4. **Client router (Astro View Transitions)**  
   If only certain pages fail, the issue may be with the transition script. You can disable View Transitions in the layout to test.

5. **Custom CSS**  
   Older Safari doesn’t support `dvh`. The project already uses `min-height: 100vh` before `min-height: 100dvh` in `global.css`. If layout is still wrong, check for other modern units (e.g. `dvh`, `svh`) and add `vh` fallbacks.

## How to test on device
- Open Safari on the iPad and go to the site.
- If possible, connect the iPad to a Mac and use Safari Develop → [device] → [page] to view the console and see the `[APP] DOMContentLoaded error` message if something throws.
- After deploying the `es2018` build, do a hard refresh or clear cache so the new bundle is loaded.
