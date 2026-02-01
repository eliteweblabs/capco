# SVG Close Buttons to Replace with CloseButton.astro

This document lists all instances of hardcoded SVG close buttons found in the project that should be replaced with the `CloseButton.astro` component.

## ✅ Already Fixed

1. **src/components/common/CookieBanner.astro** (line 19-28)
   - ✅ **FIXED** - Replaced reject button with `<CloseButton>`

2. **src/components/common/CookieBanner.astro** (line 102-115)
   - ✅ **FIXED** - Replaced preferences modal close button with `<CloseButton>`

3. **src/pages/partials/slot-machine-modal.astro** (line 85-96)
   - ✅ **FIXED** - Replaced modal close button with `<CloseButton>`

4. **src/components/blocks/GalleryBlock.astro** (line 326-333)
   - ✅ **FIXED** - Replaced lightbox close button with `<CloseButton>` (with custom white styling)

5. **src/components/project/FileManager.astro** (line 1492-1500)
   - ✅ **FIXED** - Updated to use CloseButton styling pattern in JavaScript template

## 🔧 Remaining Instances (Lower Priority)

These remaining instances are "clear" or "remove" buttons with different semantics and specific behaviors. They may not be appropriate for the CloseButton component.

### 1. src/pages/partials/slot-machine-modal.astro (Clear button)

**Location:** Lines 113-127

```astro
<button
  type="button"
  id={`${componentId}-slot-clear-btn`}
  class="absolute right-10 top-1/2 -translate-y-1/2 transform p-1.5 text-gray-400 transition-all duration-200 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 pointer-events-none"
  title="Clear search"
>
  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
</button>
```

**Note:** This is a clear button for search input with specific positioning and visibility logic (opacity-0, pointer-events-none). Consider creating a separate `ClearButton.astro` component or keeping as-is.

---

### 2. src/components/project/ProposalManager.astro (Clear Subject)

**Location:** Lines 2257-2265

```astro
<button
  type="button"
  id="clear-subject-display"
  class="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ${currentSubject ?"
  "
  :
  "hidden"}"
>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
</button>
```

**Note:** This is a clear button with conditional visibility. Consider keeping as-is or creating a `ClearButton.astro` component.

---

### 3. src/components/form/SubjectSelectDropdown.astro

**Location:** Lines 59-71

```astro
<button
  type="button"
  id={`${id}-clear`}
  class="absolute right-2.5 top-2.5 hidden h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
</button>
```

**Note:** This is a clear button for search input. Consider keeping as-is or creating a `ClearButton.astro` component.

---

### 4. src/features/ai-chat-agent/AIChatAgent.astro (Remove Image)

**Location:** Lines 475-482

```astro
<button
  class="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
  onclick="window.aiChatAgent?.removeImage('${attachment.id}')"
>
  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"
    ></path>
  </svg>
</button>
```

**Note:** This is inside a JavaScript template literal. This is a "remove" button, not a "close" button. It has specific styling (red background) and different semantic meaning. Should remain distinct.

---

## Summary

- **Total instances found:** 9
- **Fixed:** 5 (all actual "close" buttons)
- **Remaining:** 4 (clear/remove buttons with different semantics)

## Completed Fixes

All high-priority "close" buttons have been successfully replaced with the `CloseButton` component or updated to use its styling pattern:

1. ✅ CookieBanner reject button
2. ✅ CookieBanner preferences modal close
3. ✅ Slot machine modal close
4. ✅ Gallery lightbox close
5. ✅ FileManager preview modal close

## Recommendation for Remaining Items

The remaining instances are intentionally left as-is because they:

- Have different semantic meaning (clear input vs close modal)
- Require specific positioning and visibility logic
- Are "remove" actions rather than "close" actions

**Consider creating a separate `ClearButton.astro` component** if standardization of clear buttons is desired in the future.

## Implementation Notes

When replacing with `CloseButton`, the following was ensured:

1. ✅ Imported the component: `import CloseButton from "../ui/CloseButton.astro";`
2. ✅ Preserved the `id` attributes for JavaScript functionality
3. ✅ Set appropriate `tooltipText` and `position` props
4. ✅ Verified click handlers and event listeners still work
5. ✅ Added custom classes for special cases (e.g., lightbox white styling)
6. ✅ For JavaScript templates, used CloseButton's HTML structure directly
