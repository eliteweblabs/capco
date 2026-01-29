# Tutorial Overlay - Dismissable Tooltips

The TutorialOverlay component now supports dismissable tooltips for individual tutorial steps, providing a more flexible and user-friendly tutorial experience.

## Features

### Standard Tutorial Mode

- Full tutorial flow with navigation (Previous/Next/Finish buttons)
- Progress bar showing step completion
- Skip Tutorial option
- Guided walkthrough with overlay mask

### Dismissable Tooltip Mode (Per Step)

- Individual tutorial steps can be marked as dismissable tooltips
- Small close button (X) appears on dismissable steps
- No navigation buttons shown on dismissable steps
- User can dismiss the tip and continue with the tutorial flow
- Ideal for optional tips that don't require explicit acknowledgment

## Usage

### Basic Tutorial Step (Standard Mode)

```html
<button
  data-welcome='{
    "title": "Welcome to Dashboard",
    "msg": "This is your project dashboard where you can manage all your projects.",
    "position": "bottom",
    "icon": "info",
    "step": 0
  }'
>
  Dashboard Button
</button>
```

### Dismissable Tooltip Step

```html
<button
  data-welcome='{
    "title": "Quick Tip",
    "msg": "Click here to quickly add a new project. You can also use the keyboard shortcut Cmd+N.",
    "position": "right",
    "icon": "lightbulb",
    "step": 1,
    "dismissable": true
  }'
>
  New Project
</button>
```

## Properties

### data-welcome JSON Schema

| Property      | Type                                                 | Required | Default    | Description                                                 |
| ------------- | ---------------------------------------------------- | -------- | ---------- | ----------------------------------------------------------- |
| `title`       | `string`                                             | Yes      | -          | Title shown in the tutorial step                            |
| `msg`         | `string`                                             | Yes      | -          | Message/description for the step                            |
| `position`    | `"top" \| "bottom" \| "left" \| "right" \| "center"` | No       | `"bottom"` | Where to position the popover relative to the element       |
| `icon`        | `string`                                             | No       | `"info"`   | Icon to display (BoxIcons name)                             |
| `step`        | `number`                                             | No       | auto       | Step number for ordering (auto-assigned if not provided)    |
| `dismissable` | `boolean`                                            | No       | `false`    | Whether this step shows as a dismissable tooltip            |
| `action`      | `string`                                             | No       | -          | Custom action to execute (e.g., "click", "focus", "scroll") |

## When to Use Dismissable Mode

### Use Dismissable Tooltips For:

- Optional tips and shortcuts
- Contextual help that doesn't require acknowledgment
- Non-critical information
- Tips that users might want to quickly dismiss
- Tooltips that should feel lightweight and unobtrusive

### Use Standard Tutorial Mode For:

- Critical onboarding steps
- Sequential workflows that need to be followed
- Steps that require user interaction or input
- Important features that need emphasis
- Complex features that benefit from guided navigation

## Example: Mixed Tutorial Flow

```html
<!-- Step 0: Standard - Critical welcome message -->
<div
  data-welcome='{
    "title": "Welcome!",
    "msg": "Let us show you around your new dashboard.",
    "position": "center",
    "step": 0
  }'
></div>

<!-- Step 1: Standard - Important feature -->
<button
  data-welcome='{
    "title": "Create Project",
    "msg": "Click here to create your first project. This is where you will manage all project information.",
    "position": "bottom",
    "step": 1
  }'
>
  New Project
</button>

<!-- Step 2: Dismissable - Optional tip -->
<button
  data-welcome='{
    "title": "Pro Tip",
    "msg": "You can quickly search projects using Cmd+K",
    "position": "right",
    "icon": "search",
    "step": 2,
    "dismissable": true
  }'
>
  Search
</button>

<!-- Step 3: Standard - Important feature -->
<button
  data-welcome='{
    "title": "File Manager",
    "msg": "Upload and manage project documents here.",
    "position": "bottom",
    "step": 3
  }'
>
  Files
</button>

<!-- Step 4: Dismissable - Optional tip -->
<button
  data-welcome='{
    "title": "Keyboard Shortcut",
    "msg": "Press ? to see all keyboard shortcuts",
    "position": "left",
    "icon": "keyboard",
    "step": 4,
    "dismissable": true
  }'
>
  Help
</button>
```

## Implementation Details

### Dismissable Tooltip Behavior

1. **Visual Differences**:
   - Small close button (X) in the top-right corner
   - No navigation buttons (Previous/Next) shown
   - Progress bar still visible to show overall progress
   - Lighter weight appearance

2. **Interaction**:
   - Click X button to dismiss and move to next step
   - Click outside the mask to dismiss the entire tutorial
   - Press ESC to dismiss the entire tutorial
   - Progress is saved as you go

3. **Styling**:
   - Dismissable popover has `data-dismissable="true"` attribute
   - Navigation actions are hidden via CSS
   - Close button styled to be subtle but accessible

### Technical Notes

- Dismissable state is stored per step in the `TutorialStep` interface
- The popover dynamically updates its `data-dismissable` attribute per step
- Close button is injected/removed based on the step's dismissable property
- All tutorial progress is saved to the database via `/api/tutorial-config`

## Browser Compatibility

The dismissable tooltip feature works in all modern browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Accessibility

- Close button has `aria-label="Dismiss this tip"`
- Tutorial can be dismissed via keyboard (ESC key)
- Focus management maintained throughout tutorial flow
- All tooltips have proper ARIA roles and labels

## Related Components

- `TutorialOverlay.astro` - Main tutorial component
- `Tooltip.astro` - Base tooltip component with dismissable support
- `/lib/tooltip-styles.ts` - Shared tooltip styling utilities
- `/api/tutorial-config` - API endpoint for saving tutorial progress

## Future Enhancements

- [ ] Auto-dismiss after timeout for dismissable tooltips
- [ ] Animate in/out transitions for dismissable tooltips
- [ ] Persistent dismiss per-tooltip (not just per-tutorial)
- [ ] Analytics tracking for dismissed vs completed tutorials
- [ ] Customizable close button position per tooltip
