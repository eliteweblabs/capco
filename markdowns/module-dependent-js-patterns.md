# Module-dependent JS patterns (tracking)

When Astro module chunks don’t load (e.g. empty chunk in prod), any interactivity that relies on `window.*` functions set by those modules will not work. This file lists those patterns so you can add inline fallbacks or fix them in one place.

## Pattern: “if (typeof window.X === 'function') window.X(...)”

These call a global that is set by a **module script**. If the module never runs, the call is skipped and the feature does nothing.

| `window.*` | Set by (module) | Used in (files) | Status |
|------------|-----------------|------------------|--------|
| `initPageSizeToggle` | (was init-auth-globals) | — | **Replaced** – `PageSizeToggle.astro` component has button + inline script; no longer in App |
| `showNotice` | app-globals / showNotice | Navbar, profile, [id].astro, SlotMachineModal*, TabFiles, PunchlistDrawer, DeleteConfirmButton, etc. | Optional guard; showNotice usually set by App |
| `updateThemeSync` | (theme module) | App.astro (theme toggle) | Guard only |
| `hexToRgb` | app-globals | PixelGrid.astro | Guard only |
| `handleNewStatusModalAndEmail` | project page / modal | ProjectForm, TabFiles, DigitalSignature | Guard only |
| `handleSelect` | SlotMachine components | SlotMachineModal, SlotMachineModalFunction | Guard only |
| `showNotification` | (slot machine) | SlotMachineModalFunction | Guard only |
| `switchBannerAlertsTab` | banner-alerts page | admin/banner-alerts.astro | Guard only |
| `initializeDiscussions` | discussions | AdminDiscussions.astro | Guard only |
| `initFlowbite` | Flowbite CDN | Discussions.astro | Guard only |
| `unlockBodyScroll` | app-globals / modals | PageEditorModal.astro | Guard only |
| `lazyLoadImages` | app-globals | AdminMedia.astro | Guard only |
| `switchProfileTab` | profile.astro | profile.astro | Guard only |
| `isAnyMobile` | app-globals | Hero.astro | Guard only |
| `handleCmsPageDeleted` | cms.astro | cms.astro | Guard only |

## Globals set by modules (source of truth)

- **`scripts/init-auth-globals.ts`** (loaded from App.astro):  
  `initPageSizeToggle`, `validatePhone`, `formatPhoneAsYouType`  
  → **initPageSizeToggle** has an inline fallback in App.astro so “Larger page elements” works when this module doesn’t load.

- **`scripts/app-globals.ts`** (bundled into various entry points):  
  showNotice, updateThemeSync, hexToRgb, lockBodyScroll, unlockBodyScroll, lazyLoadImages, isAnyMobile, etc.  
  If the bundle that sets these doesn’t load, those features will no-op where guarded by `typeof window.X === 'function'`.

## Scripts that must run for critical UX (already fixed with inline fallbacks)

- **Google sign-in**: login.astro inline fallback + AuthProviders redirect to `/auth/login?provider=google` (no server-side start so PKCE works).
- **Alerts dismiss**: App.astro inline `[data-dismiss-alert]` and banner dismiss.
- **Dropdown (X when open, close)**: Dropdown.astro inline.
- **Share widget**: ShareWidget.astro inline.
- **Navbar logout**: Navbar.astro inline.
- **Larger page elements toggle**: `PageSizeToggle.astro` component (button + inline script).

## How to add an inline fallback

1. Implement the same behavior in an **inline script** (`<script is:inline>`) in App.astro or in the component that needs it.
2. Set `window.functionName = ...` in that inline script so it runs before or regardless of module load.
3. Keep the module that sets the same global when it does load (no duplication of behavior; module can overwrite).

## Search commands (for future passes)

```bash
# All “typeof window.* === 'function'” guards
rg "typeof window\.\w+ === ['\"]function" src --type-add 'astro:*.astro' -t astro

# All window.*() calls (may depend on module)
rg "window\.\w+\s*\(" src --type-add 'astro:*.astro' -t astro
```
