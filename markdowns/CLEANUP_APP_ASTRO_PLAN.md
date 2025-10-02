# App.astro UX Utils Cleanup Plan

## Current Problems

### 1. **Duplicate Definitions**
- `isMobile()` defined at lines 1111 AND 1248
- `isTablet()` defined at lines 1115 AND 1251
- `isDesktop()` defined at lines 1119 AND 1254

### 2. **Functions Not in ux-utils.ts**
- `isSafariBeta()` - inline in App.astro (now fixed in ux-utils.ts)
- `fixSafariViewport()` - inline in App.astro
- Other Safari functions defined inline instead of imported

### 3. **Disorganization**
- Functions scattered from line 1098 to line 1280+
- No clear import section
- Mix of inline definitions and window assignments

---

## Solution: Clean Architecture

### Step 1: Import Section (Top of `<script>` tag)
```typescript
import {
  scrollToTopOnMobile,
  scrollToTop,
  isMobile,
  isTablet,
  isDesktop,
  getViewportSize,
  debounce,
  throttle,
  hideOnMobileInput,
  isSafari,
  isSafariIOS,
  isSafariBeta,
  isSafari18OrLater,
  immediateSafariViewportFix,
  setupViewportHandling,
  ensureViewportBounds,
  lockBodyScroll,
  unlockBodyScroll
} from "../../lib/ux-utils";
```

### Step 2: Single Window Assignment Section
```typescript
// =====================================================
// EXPOSE UX UTILITIES GLOBALLY
// =====================================================
// Import functions from ux-utils.ts and make them available on window object

(window as any).scrollToTopOnMobile = scrollToTopOnMobile;
(window as any).scrollToTop = scrollToTop;
(window as any).isMobile = isMobile;
(window as any).isTablet = isTablet;
(window as any).isDesktop = isDesktop;
(window as any).getViewportSize = getViewportSize;
(window as any).debounce = debounce;
(window as any).throttle = throttle;
(window as any).hideOnMobileInput = hideOnMobileInput;
(window as any).isSafari = isSafari;
(window as any).isSafariIOS = isSafariIOS;
(window as any).isSafariBeta = isSafariBeta;
(window as any).isSafari18OrLater = isSafari18OrLater;
(window as any).immediateSafariViewportFix = immediateSafariViewportFix;
(window as any).setupViewportHandling = setupViewportHandling;
(window as any).ensureViewportBounds = ensureViewportBounds;
(window as any).lockBodyScroll = lockBodyScroll;
(window as any).unlockBodyScroll = unlockBodyScroll;
```

### Step 3: Keep App-Specific Functions (Not in ux-utils)
```typescript
// =====================================================
// APP-SPECIFIC FUNCTIONS
// =====================================================
// These are specific to App.astro and don't belong in ux-utils.ts

(window as any).createButtonPartial = async function (config: any) { ... };
(window as any).hideNotification = function () { ... };
(window as any).switchTab = function (tabName: string) { ... };
(window as any).sendEmail = async function (emailData: any, currentUser: any) { ... };
(window as any).validateEmail = function (email: string) { ... };
(window as any).getProject = async function (projectId: string | number) { ... };
(window as any).deleteProject = function (projectId: any) { ... };
(window as any).updateStatus = async function (...) { ... };
// etc...
```

### Step 4: Remove These Sections
- Lines 1098-1127 (duplicate scrolling and device detection)
- Lines 1130-1151 (duplicate debounce/throttle)
- Lines 1154-1203 (duplicate hideOnMobileInput)
- Lines 1206-1257 (duplicate Safari functions and device detection)
- Lines 1258-1283 (duplicate viewport functions)

---

## Files to Modify

1. **`src/lib/ux-utils.ts`** ✅ DONE
   - Uncommented `isSafariBeta()`
   - All UX utility functions properly exported

2. **`src/components/common/App.astro`** 🔄 TO DO
   - Add import section at top
   - Create single organized window assignment section
   - Remove all duplicate inline definitions
   - Keep only app-specific functions

---

## Benefits

✅ **Single Source of Truth**: All UX utilities defined once in `ux-utils.ts`
✅ **No Duplication**: Each function defined exactly once
✅ **Better Organization**: Clear sections with comments
✅ **Easier Maintenance**: Change function logic in one place
✅ **Proper Imports**: TypeScript can type-check imported functions
✅ **Cleaner Code**: ~200 lines removed from App.astro

---

## Implementation Order

1. ✅ Fix `ux-utils.ts` (DONE)
2. Add import statement to App.astro
3. Add organized window assignment section
4. Remove duplicate sections one by one
5. Test that all functions still work
6. Commit changes

---

## Testing Checklist

After cleanup, test:
- [ ] Mobile/tablet/desktop detection works
- [ ] Safari detection works correctly
- [ ] Scroll functions work
- [ ] Debounce/throttle work
- [ ] Form focus hiding works
- [ ] Viewport handling works
- [ ] All app-specific functions still work

