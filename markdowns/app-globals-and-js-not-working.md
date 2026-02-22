# When “JS doesn’t work” (dropdowns, form steps, etc.)

## Checklist from "Astro works on localhost but JavaScript doesn't"

1. **Client-side vs server-side**
   Interactive JS here is in `<script>` (or `is:inline`) in the template, not in frontmatter. App.astro, MultiStepForm, Navbar, etc. all follow that; frontmatter is server-only.

2. **Files deployed correctly**
   With `output: "server"`, client chunks go under `dist/`. On the **live site**, open DevTools → Network, reload, and see if any `_astro/*.js` requests return **404**. If so, the server isn't serving static assets. Try opening a chunk URL directly in the browser (e.g. `https://your-domain.com/_astro/[hash].js`).

3. **Incorrect file paths**
   If the app is served at a subpath (e.g. `example.com/app/`), set `base: '/app/'` in `astro.config.mjs`. At root domain, paths are usually fine.

---

## What's going on

1. **app-globals is turned off in production**  
   In `App.astro`, the script that loads `app-globals` is commented out because in Astro 5 production build that chunk can end up empty or broken, and loading it was stopping all later scripts (e.g. no TRACE 5 in the console).

2. **Fallback only does so much**  
   The inline fallback in `App.astro`:
   - Defines minimal `window.*` stubs (`showModal`, `hideModal`, `initFlowbite`, etc.).
   - Tries to run Flowbite when it becomes available (retries + optional dynamic CDN load).

   It does **not** define the rest of what `app-globals` used to (e.g. `getOverscrollPercent`, `hideOnFormFocus`, `__ensureSidebarInit`, `isMobile`, etc.). Code that checks `if (typeof window.x === 'function')` just no-ops when those are missing, so you get no errors but missing behavior.

3. **Flowbite from CDN**  
   Flowbite is loaded from `unpkg` (2.5.2). If that request fails (CSP, network, adblocker), `window.initFlowbite` never appears and dropdowns/collapse don’t work. The fallback now:
   - Calls `initFlowbite` when it’s available (with short retries so late CDN load is OK).
   - After ~700ms, if `initFlowbite` is still missing, injects the same script dynamically and runs init on load.
   - Uses `defer` on the main Flowbite script so it doesn’t block the rest of the page.

4. **MultiStepForm init**  
   The MEP (and other) multi-step form script runs its setup inside a `DOMContentLoaded` listener. If that script is loaded as a deferred module and runs **after** `DOMContentLoaded` has already fired, the listener never runs and the form never initializes. The component was updated so it also runs its init when the script loads if the document is already ready.

## If things still don’t work

- **Dropdowns/collapse still broken**  
  - In DevTools → Network, confirm `flowbite.min.js` (unpkg) loads (status 200).  
  - Check console for `[App] Flowbite CDN load failed` or `[App] initFlowbite error`.  
  - If you’re on a network that blocks unpkg, the dynamic fallback will still try once; if it also fails, you’d need to self-host Flowbite or switch to the npm Flowbite init (see below).

- **Form steps / other JS still broken**  
  - In console, see if you get `[MULTISTEP-FORM] Attaching handler for form: ...`. If not, the MultiStepForm script may not be running (e.g. a prior script throws and stops later ones).  
  - Check for any red errors in the console; a single module error can prevent scripts below it from running.

- **Fixing the root cause (app-globals chunk)**  
  To get back full behavior (all `window.*` helpers, Flowbite from npm, etc.):
  1. Re-enable the app-globals script in `App.astro`: uncomment  
     `{/* <script> import "../../scripts/app-globals"; </script> */}`  
     and remove or comment out the “8b. Fallback” inline script.
  2. Run a production build (`npm run build` or `build:railway`) and check the built output (e.g. under `dist/`) for the app-globals chunk: is it empty or missing?
  3. If the chunk is empty or not emitted, the problem is likely in Vite/Rollup (e.g. tree-shaking, wrong `output.format`, or a failing import). Fix that so the app-globals chunk is generated and non-empty; then re-enabling it will restore full JS behavior.

## Optional: Flowbite from npm instead of CDN

If you prefer not to rely on the CDN at all, you can add a small script that only inits Flowbite from the `flowbite` npm package (v3), and keep the fallback for the other stubs:

- Add a script (e.g. `src/scripts/flowbite-init.ts`) that does:
  - `import { initFlowbite } from 'flowbite';`
  - `window.initFlowbite = initFlowbite;`
  - Call `initFlowbite()` when the DOM is ready.
- In `App.astro`, load that script **after** the fallback (so stubs exist) and **before** or instead of the Flowbite CDN script.

Note: Your markup may target Flowbite 2 (e.g. `data-dropdown-toggle`). Flowbite 3 is generally compatible; if something breaks, you can keep the CDN for 2.5.2 and use the npm init only as a fallback when the CDN fails.
