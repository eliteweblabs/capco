# App.astro script re-enable order (minimal-scripts debug)

When `ONLY_FLOWBITE_AND_THEME = true` in `App.astro`, only these run:

- **Theme detection** (inline in `<head>`) – dark mode, `data-page-size`, `__legacySafari`
- **Flowbite** (`flowbite-init`) – dropdowns, modals, mobile nav (Flowbite components)

All other scripts are gated by `{!ONLY_FLOWBITE_AND_THEME && ( ... )}`.

## How to find what breaks nav/forms

1. Deploy or run with `ONLY_FLOWBITE_AND_THEME = true` (current state).
2. Test: mobile nav, forms, dropdowns. If they work, the cause is one of the disabled scripts.
3. Set `ONLY_FLOWBITE_AND_THEME = false` in `App.astro` to restore all scripts and confirm the breakage.
4. Set `ONLY_FLOWBITE_AND_THEME = true` again, then re-enable scripts **one at a time** by moving that script **outside** its `{!ONLY_FLOWBITE_AND_THEME && ( <> ... </> )}` block (so it always runs). Test after each. When it breaks, you’ve found the culprit.

## Re-enable order (numbered comments in App.astro)

| # | Script | Purpose |
|---|--------|--------|
| 1 | DOMContentLoaded patch | Makes late-added DOMContentLoaded/load listeners run if doc already loaded |
| 2 | Console suppression | Filters console output (Cloudflare, etc.) |
| 3 | init-auth-globals | Auth-related globals for components |
| 4 | Dynamic Color & Font Injection | CMS colors/fonts before CSS |
| 5 | Notification count loader | Bell count, `initializeNotificationCount` |
| 6 | Global typewriter | `runSimpleTypewriter`, loading typewriters |
| 7 | typewriter-text | `initTypewriterTexts`, step typewriter |
| 8 | app-globals | App-wide globals |
| 9 | hold-progress-init | Progress UI |
| 10 | Theme toggle inline | Theme button in nav/footer |
| 11 | Overscroll scale | `.overscroll-scale` effect |
| 12 | DOMContentLoaded init | Notification bell, sidebar init, `hideOnFormFocus` |
| 13 | Global Image Error Handler | Broken image fallback, network error suppress |
| 14 | AOS | Animate on scroll (link + script + init) |
| 15 | scroll-animations | Scroll blur/scale |
| 16 | lazy-load-images | Lazy loading for images |
| 17 | project-item-handlers | Project list item behavior |
| 18 | modal-global | Global modal system |

Suggested re-enable order: **1** first (DOMContentLoaded patch is a prime suspect), then **3** (auth globals for login/forms), then **12** (sidebar/notification). If it breaks when you re-enable **1**, the patch (or something that runs because of it) is the cause.

## Restore everything

Set in `App.astro`:

```ts
const ONLY_FLOWBITE_AND_THEME = false;
```

All scripts will run again.
