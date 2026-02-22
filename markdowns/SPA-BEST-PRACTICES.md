# SPA Best Practices (Astro)

**Current mode:** The app runs as an **MPA** (multi-page app): full page loads, no client-side router. SPA-style behavior (view transitions, client-side navigation) was tried and disabled; code still has `// SPA disabled:` comments and hooks ready for re-enable.

When adding or changing code, follow these practices so the codebase stays SPA-ready and avoids bugs if SPA is turned back on.

---

## 1. Event lifecycle

- **MPA (current):** Scripts run on first load; `DOMContentLoaded` and `document.readyState` are the main hooks.
- **SPA (when enabled):** Astro View Transitions swap the document body; the layout shell and many scripts stay in memory. New pages run their scripts in the new fragment. You must re-run inits that depend on the **new** DOM.

**Best practice:** Prefer one-time setup where possible. When you need “run when this page is visible”:

- **MPA:** Run on `DOMContentLoaded` (or immediately if `document.readyState !== "loading"`).
- **SPA:** Also listen for `astro:page-load` and re-run the same init (e.g. typewriter, grid filter, delete-confirm buttons, dashboard init). Existing comments like `// SPA disabled: document.addEventListener("astro:page-load", ...)` mark where to re-enable.

Do **not** rely only on `DOMContentLoaded` for behavior that must run after every navigation if you plan to use view transitions.

---

## 2. Avoid stacking listeners

- **Problem:** If you add a `click` (or other) listener on every full page load, and later switch to SPA, each navigation can add another listener without removing the previous one → duplicate handlers, leaks, wrong behavior.

**Best practice:**

- Use **one document-level listener** where possible (e.g. one delegated handler for all delete buttons, one for theme toggle), bound once in a global script (e.g. `app-globals.ts`) or in a component that is only ever mounted once (e.g. root layout).
- If a component must attach listeners to specific nodes, either:
  - Run inside a single `DOMContentLoaded` + `astro:page-load` init that **removes or replaces** previous handlers (e.g. AbortController, or check a “inited” flag and teardown), or
  - Use event delegation from a parent that persists across navigations.

Examples in this repo: `DeleteConfirmButton.astro` (single document-level click listener, no stacking); `ToggleSidebar.astro` (AbortController to clean up on re-init).

---

## 3. State and rehydration after swap

- **SPA:** After a view transition, the new HTML is in the DOM but any previous client state (e.g. “sidebar open”, “modal open”, “dismissed banners”) may need to be re-applied.

**Best practice:**

- Prefer **state in the URL or in persistent storage** (e.g. localStorage, cookies) so re-run inits can restore it. Examples: theme (`color-theme`), page-size (`data-page-size`), dismissed banners.
- For UI that is “open/closed” or similar, either:
  - Re-read from DOM/data after each `astro:page-load`, or
  - Keep state in a long-lived script (e.g. app-globals) and re-apply to the new DOM in an `astro:after-swap` / `astro:page-load` handler.

---

## 4. Globals and scripts

- **Single file for globals:** All shared `window.*` functions live in `src/scripts/app-globals.ts`. See `markdowns/APP-COMPONENT-REVIEW.md` (Global JavaScript convention).
- **Component JS:** Script that is specific to one component stays in that component. Component scripts run on each full page load; with SPA they run when their fragment is swapped in.
- **Order:** Theme/bootstrap runs first (`theme-init.ts`), then `app-globals.ts`. Do not add new global behavior in random inline scripts in App; add it to app-globals (or a single bootstrap entry) so order and SPA re-run behavior stay predictable.

---

## 5. View Transitions (when re-enabled)

- **ClientRouter:** If you re-enable `<ClientRouter fallback="swap">` for backend routes, navigation will be client-side; full HTML will still be fetched and swapped.
- **Hooks to use:**
  - `astro:page-load` – new view has been swapped; run DOM-dependent inits (e.g. typewriter, AOS, grid filter, dashboard).
  - `astro:after-swap` – good for re-applying theme, scroll position, or other shell-level state.
- **What to re-run on `astro:page-load`:** Any init that (a) queries the DOM and (b) is specific to the current page or fragment. Search the repo for `// SPA disabled:` to find commented `astro:page-load` listeners and restore them when enabling SPA.

---

## 6. Checklist for new features

- [ ] If the feature adds a listener, is it document-level (one binding) or cleaned up on re-init (e.g. AbortController) so SPA navigations don’t stack?
- [ ] If the feature must “run when this page is visible”, is there a single init that can be called from both `DOMContentLoaded` and (when SPA is on) `astro:page-load`?
- [ ] Is any new global (`window.*`) added in `app-globals.ts` (or another single bootstrap file) rather than in an inline or one-off script?
- [ ] If the feature depends on theme, scroll, or other shell state, can that state be re-applied after a view transition (e.g. in `astro:after-swap` or inside app-globals)?

---

## 7. References

- Astro View Transitions: https://docs.astro.build/en/guides/view-transitions/
- Current app shell and script order: `markdowns/APP-COMPONENT-REVIEW.md`
- Global JS convention: same doc, section “Global JavaScript convention”
