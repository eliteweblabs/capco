# Button Refactoring Task

## Overview
Replace all raw `<button>` elements with standardized `Button.astro` component throughout the codebase.

## Component to Use
- **Primary**: `src/components/common/Button.astro`
- **Delete actions**: `src/components/common/DeleteConfirmButton.astro`
- **Close actions**: `src/components/common/CloseButton.astro`

## Progress
- **Total instances found**: 340
- **Fixed**: 2
- **Remaining**: 338

## Fixed Files
1. ✅ `src/pages/admin/settings.astro` - Fixed 2 button instances
   - Line 348: "Add Social Network" button → Button.astro with ghost variant
   - Line 1312: Delete social button → Using Button.astro with delete-confirm pattern

## Button.astro Component API

### Props
- `type`: "button" | "submit" | "reset"
- `variant`: "primary" | "secondary" | "success" | "warning" | "danger" | "outline" | "ghost" | "link" | "loading" | "disabled" | "anchor" | "selected" | "tab"
- `size`: "xs" | "sm" | "md" | "lg" | "xl"
- `icon`: Font Awesome icon name (e.g., "fa-solid-plus")
- `iconPosition`: "left" | "right"
- `iconClasses`: Custom classes for icon
- `href`: For link buttons
- `id`, `name`, `value`: Standard attributes
- `class`: Additional CSS classes
- `dataAttributes`: Object of data-* attributes
- `disabled`, `loading`: Boolean states

### Usage Examples

#### Basic Button
```astro
<Button variant="primary" size="md">
  Click Me
</Button>
```

#### With Icon
```astro
<Button variant="ghost" icon="fa-solid-plus" size="sm">
  Add Item
</Button>
```

#### Delete Button
```astro
<DeleteConfirmButton
  id="delete-item-123"
  size="sm"
/>
```

## Remaining Files to Fix

### High Priority (Admin Pages)
- src/pages/admin/cms.astro - 11 instances
- src/pages/admin/design.astro - 20 instances
- src/pages/admin/pdf-certify.astro - 3 instances
- src/pages/admin/banner-alerts.astro - 5 instances
- src/pages/admin/notifications.astro - 1 instance
- src/pages/admin/icons.astro - 1 instance
- src/pages/admin/update-test.astro - 1 instance
- src/pages/admin/design/placeholders.astro - 1 instance

### Features
- src/features/pdf-system/PDFSystem.astro - 24 instances
- src/features/ai-chat-agent/AIChatAgent.astro - 4 instances
- src/features/chat/components/UnifiedChat.astro - 5 instances
- src/features/chat/components/SocketChatWidget.astro - 1 instance
- src/features/chat/components/HttpChatWidget.astro - 1 instance
- src/features/grid-filter/GridFilter.astro - 2 instances
- src/features/media-filter/MediaFilter.astro - 2 instances
- src/features/maps/components/MapboxWidget.astro - 9 instances

### Components
- src/components/blocks/FAQBlock.astro - 1 instance
- src/components/blocks/AlertBlock.astro - 4 instances
- src/components/blocks/GalleryBlock.astro - 7 instances
- src/components/ui/ToggleSidebar.astro - 1 instance
- src/components/ui/UnifiedNotification.astro - 2 instances
- src/components/ui/SpeedDial.astro - 7 instances
- src/components/ui/PageEditorModal.astro - 2 instances
- src/components/form/* - Multiple files with many instances

### Project Pages
- src/pages/project/settings.astro - 7 instances
- src/pages/project/[id]/generate-pdf.astro - 5 instances

### Other Pages
- src/pages/voice-assistant.astro - 13 instances
- src/pages/voice-assistant-vapi.astro - 4 instances
- src/pages/contact-hybrid.astro - 6 instances
- src/pages/tests/* - Multiple test files

## Notes
- Always check for existing Button.astro import before adding
- Map classes to appropriate variant and size props
- Extract icons to icon prop when possible
- Use DeleteConfirmButton for delete actions
- Use CloseButton for modal/dialog close actions
- Maintain all data attributes using dataAttributes prop
- Preserve all event handlers (onclick, etc.)

## Next Steps
1. Continue with high-priority admin pages
2. Move to features directory
3. Fix components
4. Update form components
5. Clean up test files last
