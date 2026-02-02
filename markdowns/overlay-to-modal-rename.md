# Overlay Component Renamed to Modal

## Summary

The `Overlay.astro` component has been renamed to `Modal.astro` for consistency across the codebase. All imports and usage have been updated.

## Changes Made

### File Renamed
- `src/components/ui/Overlay.astro` → `src/components/ui/Modal.astro`

### Component Updates
Updated the component's internal documentation and default values:
- JSDoc comment: "Overlay Component" → "Modal Component"
- Default id: `"overlay"` → `"modal"`
- Data attribute: `data-overlay` → `data-modal`

### Import Statements Updated
All 6 files that imported the component have been updated:

1. `src/components/ui/App.astro`
   ```diff
   - import Overlay from "../ui/Overlay.astro";
   + import Modal from "../ui/Modal.astro";
   ```

2. `src/components/ui/PageEditorModal.astro`
   ```diff
   - import Overlay from "./Overlay.astro";
   + import Modal from "./Modal.astro";
   ```

3. `src/components/common/NotificationsModal.astro`
   ```diff
   - import Overlay from "../ui/Overlay.astro";
   + import Modal from "../ui/Modal.astro";
   ```

4. `src/pages/admin/cms.astro`
   ```diff
   - import Overlay from "../../components/ui/Overlay.astro";
   + import Modal from "../../components/ui/Modal.astro";
   ```

5. `src/components/ui/SpeedDial.astro`
   ```diff
   - import Overlay from "./Overlay.astro";
   + import Modal from "./Modal.astro";
   ```

6. `src/components/project/PunchlistDrawer.astro`
   ```diff
   - import Overlay from "../ui/Overlay.astro";
   + import Modal from "../ui/Modal.astro";
   ```

### Component Usage Updated
All 4 component usages have been updated from `<Overlay` to `<Modal`:

1. **CMS Page** (`src/pages/admin/cms.astro`)
   ```astro
   <Modal id="page-editor-modal-overlay" zIndex={10049} blurAmount="none" opacity="50" />
   ```

2. **Speed Dial** (`src/components/ui/SpeedDial.astro`)
   ```astro
   <Modal id="speed-dial-overlay" zIndex={9999} mobileOnly={true} />
   ```

3. **Notifications Modal** (`src/components/common/NotificationsModal.astro`)
   ```astro
   <Modal id="notificationsModal-overlay" zIndex={100010} blurAmount="lg" opacity="50" />
   ```

4. **Page Editor Modal** (`src/components/ui/PageEditorModal.astro`)
   ```astro
   <Modal id={`${id}-overlay`} zIndex={zIndex - 1} blurAmount="none" opacity="50" />
   ```

## Z-Index Updates

During this refactoring, the CMS page modal z-indices were also updated:
- Modal overlay: `49` → `10049`
- Modal wrapper: `z-50` → `z-[10050]`

This ensures the modal appears above other elements on the page.

## Notes

- The `TutorialOverlay` component is a separate component and was not affected by this change
- Markdown documentation files still reference the old `Overlay` component name but do not affect functionality
- All JavaScript that references modal overlays by ID continues to work as expected (only the component name changed, not the IDs)

## Benefits

- **Consistency**: All modal-related components now use "Modal" terminology
- **Clarity**: The component name better reflects its primary use case (modal backdrops)
- **Maintainability**: Easier to understand the codebase with consistent naming

---

*Date: 2026-02-02*
