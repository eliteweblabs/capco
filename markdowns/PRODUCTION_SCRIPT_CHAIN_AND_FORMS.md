# Production script chain and why forms can “not load”

This doc maps how scripts run on the layout and what can make **forms (MultiStepForm)** appear broken only in production.

## How forms get their behavior

- **MultiStepForm.astro** has a `<script>` that imports `initializeMultiStepForm` from `multi-step-form-handler.ts` and runs on `DOMContentLoaded` (or immediately if the script loads late).
- That script is bundled as a **separate client chunk**. If that chunk fails to load (404, wrong path, or a dependency inside it throws), the form HTML renders but **step navigation and validation never run** (“forms not loading”).

## Script order in App.astro (layout)

Rough order of execution:

1. **Inline head scripts** (console suppression, theme) – run first.
2. **init-auth-globals** (module) – sets `window.initPageSizeToggle`, `validatePhone`, `formatPhoneAsYouType`.
3. **Dynamic colors/fonts** (inline with `define:vars`) – runs before CSS.
4. **flowbite-init** (module) – `import "flowbite"` then `initFlowbite()`. Dropdowns/popovers need this.
5. **app-globals** (module) – large bundle; sets most `window.*` helpers and calls `initFlowbite()` again on `DOMContentLoaded` as fallback.
6. **Theme toggle, overscroll, DOMContentLoaded init** (inline + module) – e.g. `hideOnFormFocus()`, notification count.
7. **Page and component scripts** – e.g. MultiStepForm’s script when the page contains a form.

If an **earlier** script or chunk fails (e.g. app-globals or flowbite), later scripts still load and run **unless** something in the same chain throws and breaks the process. The main risk we fixed: a **DOMContentLoaded** handler in App.astro was calling `hideOnFormFocus()` without checking; if app-globals never ran (chunk 404 or throw), that call threw and could make the page appear broken.

## What was fixed (defensive)

- **hideOnFormFocus / DOMContentLoaded** (App.astro): The handler now only calls `hideOnFormFocus` and `initializeNotificationCount` if they exist on `window`, and the whole callback is in try/catch. So one missing global or thrown error in that handler no longer breaks the rest of the page.
- **@floating-ui/dom** (Tooltip + SpeedDial): Removed bare specifier from inlined SpeedDial script; Tooltip uses dynamic import; Vite alias forces bundling. Prevents “Failed to resolve module specifier” in production.

## If forms still don’t load in production

1. **Console** – Check for:
   - `Failed to resolve module specifier` (any package name) → some chunk or inlined code still has a bare import.
   - 404 on `/_astro/…` or `/assets/…` → chunk path or deploy base URL wrong.
   - Any **uncaught exception** in a script that runs before or with MultiStepForm (e.g. in app-globals or flowbite-init).
2. **Network** – Confirm every script/chunk requested by the form page returns 200 (no 404 for the MultiStepForm or multi-step-form-handler chunk).
3. **Order** – Ensure no inline or module script that runs before MultiStepForm throws; that can leave the page in a bad state even if the form chunk loads later.

## Summary

- Forms “load” when the **MultiStepForm script** runs and calls `initializeMultiStepForm`. That script depends on its chunk (and its dependencies) loading and not throwing.
- The rest of the layout (flowbite, app-globals, hideOnFormFocus, etc.) is now guarded so a single failure there is less likely to break the whole page; the root cause of “forms not loading” is still usually a **failed or throwing script/chunk** in that chain (often a module resolution or 404 in production).
