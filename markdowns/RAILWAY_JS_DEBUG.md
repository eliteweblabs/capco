# Railway JS Debug (Nuclear Logging)

When the app is deployed to Railway, JS can fail there while working on localhost. This doc describes the **nuclear option** debug layer added to pinpoint the failure.

## What Was Added

1. **Production-only bootstrap script** (first script in `<head>` in `App.astro`)
   - Runs only when hostname is **not** localhost/127.0.0.1/192.168.x.
   - On Railway (or any production host), it:
     - Registers `window.onerror` and `unhandledrejection` to capture every error.
     - Listens for script load failures (e.g. 404 on a chunk).
     - Defines `window.__railway_checkpoint(id)` so we can see how far execution got.
     - Injects a **floating debug panel** at the bottom of the page.

2. **Checkpoints** (inline scripts after critical script blocks)
   - `debug-bootstrap-done` – debug script ran.
   - `after-theme` – theme detection ran.
   - `after-init-auth-globals` – after init-auth-globals bundle.
   - `after-dynamic-colors` – after CMS colors/fonts injection.
   - `after-flowbite-init` – after Flowbite init.
   - `after-app-globals` – after app-globals (UX utils, etc.).
   - `after-modal-global` – after modal-global.
   - `after-lazy-load-images` – after lazy-load-images.
   - `DOMContentLoaded` – when DOM is ready (and script URLs are logged).
   - `panel-injected` – debug panel added to DOM.
   - `DOMContentLoaded-hideOnFormFocus` – inside the main DOMContentLoaded handler.

## How to Use on Railway

1. Deploy to Railway and open the site in a browser (not localhost).
2. Open DevTools → Console. You should see `[RAILWAY-DEBUG] checkpoint: ...` for each step that runs.
3. A **debug panel** is fixed at the bottom of the page:
   - **Checkpoints** – list of checkpoint ids and timestamps (shows how far JS got).
   - **Errors** – last 5 captured errors (script load failures, uncaught errors, unhandled rejections).
   - **Toggle** – show/hide panel.
   - **Copy dump** – copies full `__RAILWAY_DEBUG` JSON to clipboard.
4. In the console you can:
   - `copy(__RAILWAY_DEBUG.dump())` – copy full env, errors, and checkpoints.
   - `__RAILWAY_DEBUG.errors` – array of captured errors.
   - `__RAILWAY_DEBUG.checkpoints` – array of checkpoint entries.
   - `__RAILWAY_DEBUG.scriptUrls` – list of script URLs on the page (set after DOMContentLoaded).

## Interpreting Results

- **Last checkpoint** – Execution stopped after that script. The **next** script in order either failed to load (404/network) or threw during parse/run.
- **Errors** – `script-load` = a `<script src="...">` failed (often 404 or wrong base URL). `error` = uncaught exception. `unhandledrejection` = promise rejection.
- **scriptUrls** – If a chunk URL is wrong (e.g. absolute path when app is under a subpath), you’ll see it here and get a `script-load` error for that URL.

## Common Railway vs Localhost Causes

- **Wrong asset base** – Railway/proxy serves app at a subpath; Astro emits `/assets/...` but app is at `https://foo.railway.app/myapp/`. Fix: set `base` in `astro.config.mjs` or ensure reverse proxy passes correct path.
- **Script 404** – One bundled chunk 404s; later scripts never run. Check `__RAILWAY_DEBUG.scriptUrls` and try opening each URL in a new tab.
- **CSP or security headers** – Blocking inline or script sources. Check response headers and CSP report/console.
- **Env at build time** – `process.env.*` or `import.meta.env` differ on Railway build; a module might throw when a value is missing.

## Removing the Debug Layer

After you’ve fixed the issue:

1. In `App.astro`, remove the first `<script is:inline>` block (the whole “Nuclear JS debug” block).
2. Remove all checkpoint one-liners:  
   `<script is:inline>if (window.__railway_checkpoint) window.__railway_checkpoint("...");</script>`
3. Remove the single checkpoint line inside the DOMContentLoaded handler:  
   `if ((window as any).__railway_checkpoint) (window as any).__railway_checkpoint("DOMContentLoaded-hideOnFormFocus");`

Optionally keep the bootstrap script but gate the panel (e.g. only when `?railway_debug=1` is in the URL) so you can turn it on without removing it.
