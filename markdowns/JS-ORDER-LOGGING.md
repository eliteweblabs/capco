# [JS-ORDER] — Script execution order logging

One `[JS-ORDER] N label` log was added at the **very beginning** of each script that runs in the browser. The number `N` is a global counter (1, 2, 3, …) so you can see the **exact order** scripts run.

## How to use it

1. Open the site (localhost or production).
2. Open DevTools → **Console**.
3. Filter by `JS-ORDER` (or leave unfiltered and look for `[JS-ORDER]`).
4. Reload the page.

You’ll see lines like:

```
[JS-ORDER] 1 App theme (inline)
[JS-ORDER] 2 App dynamic colors (inline)
[JS-ORDER] 3 Flowbite script tag (inline after CDN)
[JS-ORDER] 4 App fallback / ensureGlobals (inline)
[JS-ORDER] 5 hold-progress-init
[JS-ORDER] 6 App theme toggle (inline)
...
[JS-ORDER] 12 MultiStepForm (module)
[JS-ORDER] 13 ToggleSidebar (module)
...
```

## What this tells you

- **Order** — The counter is the real execution order. If “MultiStepForm (module)” is 12 and “ToggleSidebar (module)” is 13, ToggleSidebar’s script ran right after MultiStepForm.
- **What actually ran** — If a script never appears (e.g. no “MultiStepForm (module)”), that script **did not run**. That’s the real problem (e.g. chunk 404, or a prior script threw and stopped the rest).
- **What didn’t run** — Compare the list to what you expect. Missing numbers or missing labels = something stopped the pipeline or a chunk didn’t load.

## Where logs were added

- **App.astro**: theme, dynamic colors, Flowbite tag, fallback, theme toggle, overscroll, DOMContentLoaded-init, image error handler, AOS.
- **Imported modules** (first line that runs when the module loads): init-auth-globals, hold-progress-init, scroll-animations, lazy-load-images, project-item-handlers, modal-global.
- **Components**: ToggleSidebar (module + prod fallback inline), AlertBlock, BannerAlert, MultiStepForm, Navbar, PixelGrid.

## After you have the order

Once you see the real order (and which scripts never run), you can:

- Fix the **first** script that doesn’t run (e.g. fix 404 for that chunk, or fix the error in the script that runs just before it).
- Stop adding “fixes” to scripts that never execute.

You can remove these logs later by searching for `__jsOrderLog` and the `[JS-ORDER]` string.
