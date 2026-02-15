# Rollback cherry-pick report (30-min revert)

## What was reverted

Commit **5a417fde** (“refactor: Enhance Prettier configuration and UI components…”) was reverted. These **34 files** were in that commit:

| # | File |
|---|------|
| 1 | `.prettierrc` |
| 2 | `package-lock.json` |
| 3 | `package.json` |
| 4 | `src/components/common/UserIcon.astro` |
| 5 | `src/components/common/NotificationsModal.astro` |
| 6 | `src/components/common/TooltipFloating.astro` |
| 7 | `src/components/form/AuthProviders.astro` |
| 8 | `src/components/form/MultiStepForm.astro` |
| 9 | `src/components/form/StaffSelectTooltip.astro` |
| 10 | **`src/components/layouts/LayoutCentered.astro`** ← **NOT RESTORED (suspect)** |
| 11 | `src/components/layouts/LayoutFullWidth.astro` |
| 12 | `src/components/layouts/LayoutTwoColumn.astro` |
| 13 | `src/components/project/ProjectItem.astro` |
| 14 | `src/components/project/PunchlistDrawer.astro` |
| 15 | `src/components/ui/App.astro` |
| 16 | `src/components/ui/Aside.astro` |
| 17 | `src/components/ui/Dropdown.astro` |
| 18 | `src/components/ui/Footer.astro` |
| 19 | `src/components/ui/LoadingSpinner.astro` |
| 20 | `src/components/ui/Logo.astro` |
| 21 | `src/components/ui/Navbar.astro` |
| 22 | `src/components/ui/ThemeToggle.astro` |
| 23 | `src/components/ui/UserProfileDropdown.astro` |
| 24 | `src/features/banner-alert/components/BannerAlertsLoader.astro` |
| 25 | `src/lib/button-styles.ts` |
| 26 | `src/lib/content.ts` |
| 27 | `src/lib/feature-navigation.ts` |
| 28 | `src/lib/multi-step-form-handler.ts` |
| 29 | `src/pages/api/global/global-classes.ts` |
| 30 | `src/pages/auth/callback.astro` |
| 31 | `src/pages/auth/login.astro` |
| 32 | `src/pages/partials/slot-machine-modal.astro` |
| 33 | `src/pages/project/dashboard.astro` |
| 34 | `src/styles/colors.css` |
| 35 | `src/styles/global.css` |

## Current state

- **33 of 34 files** from that commit have been restored (cherry-picked back from `5a417fde`).
- **Only `src/components/layouts/LayoutCentered.astro`** was **not** restored, so the site should load and CSS/content should work.

## Suspect: `LayoutCentered.astro`

- That layout is the one that wraps the **DotGrid** component on the home/centered pages.
- When the refactor was fully applied (including LayoutCentered), the site failed to load properly (CSS missing, content broken); adding an early `return` in DotGrid fixed loading, which points to DotGrid/layout interaction.
- So the offending file from the reverted commit is very likely **`src/components/layouts/LayoutCentered.astro`**.

## How to confirm

1. **Confirm site loads now**  
   Open `http://localhost:4321` and check that the home page loads with styles and content.

2. **Confirm LayoutCentered is the culprit**  
   Restore only that file and reload:
   ```bash
   git checkout 5a417fde -- src/components/layouts/LayoutCentered.astro
   ```
   If the site then fails to load (or CSS/content break again), that confirms it.

3. **To keep the refactor but fix the layout**  
   - Keep the current repo state (all other 33 files from the commit).
   - Edit **`LayoutCentered.astro`** manually: either re-apply your desired layout/UI changes without the DotGrid-related or script-related changes that cause the break, or fix DotGrid (e.g. buffer cap / safe defaults) and then restore LayoutCentered.

## Restore order used (for re-testing one-by-one)

If you want to re-run “restore one file at a time and test in browser” yourself:

1. Start from current `main` (or the commit before `5a417fde`).
2. Restore files in the table order above (1 → 35), **skipping #10 (LayoutCentered)**.
3. After each restore, reload `http://localhost:4321` and check that the site still loads.
4. When you’re ready to test the suspect: restore **only** `src/components/layouts/LayoutCentered.astro` and reload; expect the site to break if this is the offending file.

---

*Report generated after cherry-picking reverted files and leaving LayoutCentered.astro out.*
