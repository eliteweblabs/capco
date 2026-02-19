# Deep Scan: Unused Code, Functions & Duplication

**Date:** 2025-02-18  
**Scope:** `src/` (excluding node_modules, supascale/.build, flowbite-examples)

**Update 2025-02-18:** Global window utilities added for `hexToRgb`, `formatFileSize`, `getFileIcon`, `getFileIconSvg`, `formatDate`, `formatCurrency`, `isValidEmail`. Duplicates removed in settings, PixelGrid, AdminMedia, MediaFilter, FileManager, FileUpload, ProjectPortfolio, FeaturedProjects, ProjectPortfolioSocial, FinanceDashboard, PaymentsManager, LayoutProductCapco, webhook/email, webhook/_callee. See `src/lib/global-display-utils.ts` and `src/scripts/app-globals.ts`.

---

## 1. Unused Exports / Dead Code

### `src/lib/` — Libraries with unused exports

| File | Unused export(s) | Notes |
|------|------------------|-------|
| `SlotMachine.ts` | `SlotMachine` class | Never imported. Slot machine modals use inline `showSlotMachineModal*` implementations in Astro components. File assigns to `window.SlotMachine` but nothing loads it. |
| `api/index.ts` | `ApiClient`, `apiClient` | Only `Project` type and `_projects` functions are used. |
| `api/_projects.ts` | `fetchProjectsWithStatus` | Not imported anywhere. |
| `color-utils.ts` | `getPrimaryColor`, `getPrimaryColorPalette` | `hexToRgb` and `generateColorPalette` are used; these two are not. |
| `media.ts` | `formatFileSize`, `getFileIcon`, `downloadFile`, `getFileTypeFromExtension` | **None imported.** Components implement their own. |
| `_scroll-lock.ts` | `lockBodyScroll`, `unlockBodyScroll`, `forceUnlockBodyScroll` | Entire file unused. `app-globals.ts` and `ux-utils.ts` provide scroll lock via `window` instead. |
| `_api-optimization.ts` | `createValidationErrorResponse`, `createAuthErrorResponse`, `createAuthorizationErrorResponse`, `createNotFoundErrorResponse`, `createServerErrorResponse`, `createRateLimitErrorResponse`, `createPaginatedResponse`, `handleCorsPreflight`, `validateRequiredFields`, `sanitizeString`, `isValidEmail`, `isValidPhone`, `generateRandomString`, `formatCurrency`, `formatDate`, `calculateOffset`, `clamp`, `deepClone`, `isEmpty`, `safeJsonParse`, `safeJsonStringify` | Only `createErrorResponse` and `createSuccessResponse` are imported. |
| `console-interceptor.ts` | `disableConsoleLogs`, `truncateConsoleLogs`, `disableConsoleDebug`, `createSelectiveConsoleInterceptor` | Only `setupConsoleInterceptor` is imported. |
| `features.ts` | `featureGate`, `getEnabledFeatures`, `anyFeatureEnabled`, `allFeaturesEnabled`, `getFeatureConfig`, `isFeatureDisabled` | Only `isFeatureEnabled` (re-export from content) is used. |
| `certificate-loader.ts` | `validateCertificate` | `pdf-signing.ts` defines and uses its own local `validateCertificate`; this export is unused. |
| `stripe.ts` | `supportedPaymentMethods`, `SupportedPaymentMethod` | Not imported. |
| `url-utils.ts` | `buildUrl`, `buildApiUrl` | `getBaseUrl`, `getApiBaseUrl`, `ensureProtocol` are used; these two are not. `Discussions.astro` has a "simplified" inline `buildUrl`. |
| `avatar-utils.ts` | Entire module | No imports from outside. `getSafeAvatarUrl` uses `validateAvatarUrl` internally; all exports may be dead unless loaded dynamically. |

### `src/components/` — Unused components

| File | Notes |
|------|-------|
| `admin/index.ts` | `adminComponents`, `AdminComponentName` — never imported. |
| `ReactFlowDemo.tsx` | Default export not imported anywhere. |
| `Charts-Ripped.astro` | Not imported. |
| `SocketOrig.astro` | Not imported. |
| `__CampfireChatWidget.astro` | In `.prettierignore`; likely deprecated. |

---

## 2. Dead Code Paths (Entire Files / Blocks)

| File | Description |
|------|--------------|
| `src/lib/project-refresh-manager.ts` | Entire file deprecated. App.astro has commented-out import: "DISABLED - use generic refresh-manager.ts instead". |
| `src/pages/api/pdf/data.backup.ts` | Backup variant — confirm if still needed. |
| `src/pages/api/vapi/cal-integration-local.ts` | Local integration; may be test-only. |

---

## 3. Duplicate Code Patterns

### A. `formatFileSize`

Same logic duplicated in 5+ places:

| Location | Lines (approx) | Notes |
|----------|----------------|-------|
| `src/lib/media.ts` | 813-820 | Canonical implementation; **never imported**. |
| `src/components/admin/AdminMedia.astro` | 445-452, 835-861 | Duplicate (duplicate within same file) |
| `src/components/project/FileManager.astro` | 981-1009 | Client-side script |
| `src/features/media-filter/MediaFilter.astro` | 226-232 | Server + client |
| `src/components/form/FileUpload.astro` | 247-254 | Client-side |

**Recommendation:** Create shared `formatFileSize` in a module (or use `lib/media.ts`) and import everywhere.

### B. `getFileIcon`

| Location | Lines (approx) | Notes |
|----------|----------------|-------|
| `src/lib/media.ts` | 822-893 | Returns inline SVG strings; not imported. |
| `src/components/admin/AdminMedia.astro` | 453-525 | Returns SimpleIcon names (e.g. `"file"`, `"image"`, `"file-pdf"`). |
| `src/components/project/FileManager.astro` | 1010-1049 | Returns SVG strings. |
| `src/features/media-filter/MediaFilter.astro` | 233-305 | Returns SimpleIcon names. |

Note: `file-icon.ts` provides `getFileIconSvg` (SVG output) used by ProjectItem and project-item-handlers. Media components use SimpleIcon name convention. Consolidation should account for both.

**Recommendation:** Create `getFileIconForSimpleIcon(fileType, fileName?)` returning SimpleIcon name, and optionally `getFileIconSvg` (or keep `file-icon.ts` for that). Centralize logic in one place.

### C. `hexToRgb`

| Location | Notes |
|----------|-------|
| `src/lib/color-utils.ts` | 114-122 — canonical, used by App.astro |
| ~~`src/pages/admin/settings.astro`~~ | **Fixed:** Uses `window.hexToRgb` |
| ~~`src/components/ui/PixelGrid.astro`~~ | **Fixed:** Uses `window.hexToRgb` |

**Status:** Resolved — `hexToRgb` added to `window` in app-globals.

### D. `showSlotMachineModalStaff` / `showSlotMachineModal`

Large blocks of nearly identical logic across:

| File | Lines (approx) |
|------|----------------|
| `SlotMachineModalStaff.astro` | 614-1755 |
| `StaffSelectTooltip.astro` | 576-1649 |
| `SlotMachineTooltip.astro` | 607-1748 |
| `SlotMachineModal.astro` | 501-1710 |
| `SlotMachineModalFunction.astro` | 790-2064 |

Same structure: config destructuring, selectedIndex, originalOptions, fetch modal partial, DOM manipulation, scroll lock, etc.

**Recommendation:** Extract shared logic into a single JS/TS module (e.g. `lib/slot-machine-modal-shared.ts`) and reuse across components. High impact.

### E. Slot machine CSS (`.slot-machine-*`)

Almost identical styles duplicated in:

- SlotMachineModalStaff.astro
- SlotMachineTooltip.astro
- StaffSelectTooltip.astro
- SlotMachineModal.astro
- SlotMachineModalFunction.astro

**Recommendation:** Move to a shared CSS file or Tailwind @layer.

### F. `isValidEmail`

| Location | Notes |
|----------|-------|
| `src/lib/_api-optimization.ts` | 242 — not imported |
| `src/pages/api/webhook/email.ts` | 330 — inline |
| `src/pages/api/webhook/_callee.ts` | 198 — exported, used locally |
| `LayoutProductCapco.astro` | 252 — inline |

### G. `formatDate` / `formatCurrency`

| Location | Notes |
|----------|-------|
| `_api-optimization.ts` | formatDate, formatCurrency — not imported |
| `ProjectPortfolio.astro` | formatDate inline |
| `FeaturedProjects.astro` | formatDate inline |
| `ProjectPortfolioSocial.astro` | formatDate inline |
| `SimpleProjectLog.astro` | formatDate inline |
| `FinanceDashboard.astro` | formatCurrency inline |
| `PaymentsManager.astro` | formatCurrency, formatDate inline |

---

## 4. Summary Counts

| Category | Count |
|----------|-------|
| Unused exports (lib) | 40+ |
| Unused exports (components) | 2 modules, 3 components |
| Dead files | 1 (project-refresh-manager) |
| Duplicate code patterns | 7 (formatFileSize, getFileIcon, hexToRgb, showSlotMachine*, slot-machine CSS, isValidEmail, formatDate/formatCurrency) |
| Files with duplication | 15+ |

---

## 5. Prioritized Recommendations

### High impact

1. **Slot machine modal** — Extract shared `showSlotMachineModal*` logic and CSS into a single module; reuse across 5 components. Removes ~1000+ lines of duplication.
2. **formatFileSize / getFileIcon** — Use `lib/media.ts` (or a new shared media-helpers module) and import in AdminMedia, FileManager, MediaFilter, FileUpload. Align return types (SimpleIcon names vs SVG).
3. **Remove or archive** `SlotMachine.ts` if inlined implementations are the source of truth.

### Medium impact

4. **hexToRgb** — Replace inline copies in `settings.astro` and `PixelGrid.astro` with import from `color-utils.ts`.
5. **Prune unused exports** from `_api-optimization.ts`, `console-interceptor.ts`, `features.ts`, `media.ts`.
6. **Decide on** ReactFlowDemo, Charts-Ripped.astro, SocketOrig.astro — use or remove.
7. **Remove or refactor** `project-refresh-manager.ts` — delete if no longer needed.

### Low impact

8. **adminComponents / AdminComponentName** — Remove or wire into real usage.
9. **ApiClient / apiClient** — Remove or add usage if intended for future.
10. **buildUrl / buildApiUrl** — Use in Discussions.astro instead of inline `buildUrl`.
11. **_scroll-lock.ts** — Remove if confirmed redundant with app-globals/ux-utils.
12. **avatar-utils.ts** — Verify if any dynamic import exists; otherwise consider removal.

---

## 6. Verification Commands

```bash
# Check if SlotMachine.ts is loaded anywhere
rg "SlotMachine\.ts|SlotMachine" src/

# Check formatFileSize imports
rg "formatFileSize|from.*media" src/

# Check scroll-lock imports
rg "_scroll-lock|lockBodyScroll" src/

# Check project-refresh-manager
rg "project-refresh-manager" src/
```
