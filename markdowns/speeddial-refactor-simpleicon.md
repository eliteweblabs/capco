# SpeedDial Refactor - SimpleIcon Components

## Changes Made
Refactored the SpeedDial component to use SimpleIcon components wrapped in native button elements with Tooltips, removing the Button component dependency.

## Benefits

### 1. Simpler Component Structure
- **Before**: Button component with icon props → SimpleIcon internally
- **After**: Direct SimpleIcon usage in button elements
- Removes unnecessary abstraction layer for icon-only buttons

### 2. More Control
- Direct access to button and icon styling
- No need to work around Button component's text/icon layout logic
- Cleaner HTML output

### 3. Consistency
- All speed dial buttons use identical structure
- Uniform styling with Tailwind classes
- Same behavior across all buttons

## Structure

Each speed dial button now follows this pattern:

```astro
<Tooltip position="left" open={true} text="Label" className="-translate-y-2.5">
  <button
    id="unique-id"
    type="button"
    title="Description"
    aria-label="Description"
    onclick="optional click handler"
    class="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-xs hover:bg-primary-800 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
  >
    <SimpleIcon name="icon-name" size="lg" />
  </button>
</Tooltip>
```

## Button Classes Breakdown

```css
flex                    /* Flexbox for centering icon */
h-12 w-12              /* 48x48px button size */
items-center           /* Vertical center */
justify-center         /* Horizontal center */
rounded-full           /* Circular button */
bg-primary-700         /* Primary color background */
text-white             /* White icon color */
shadow-xs              /* Subtle shadow */
hover:bg-primary-800   /* Darker on hover */
focus:outline-none     /* Remove default outline */
focus:ring-4           /* Custom focus ring */
focus:ring-primary-300 /* Focus ring color */
dark:*                 /* Dark mode variants */
```

## Icons Used

1. **Tutorial**: `book` - Shows tutorials/guides
2. **Debug**: `bug` - Admin debug panel
3. **Login**: `user` - User login
4. **Phone**: `phone` - Call company
5. **Feedback**: `comment-dots` - Feedback form
6. **Contact**: `message-square` - Contact page

## Icon Sizing

- All icons use `size="lg"` which renders as 24×24px
- Icons are centered in 48×48px circular buttons
- Provides good visual balance and touch targets

## Removed Dependencies

- No longer imports Button component
- No need for `buttonClasses` constant
- No need for `iconClasses` constant
- Simpler imports (SimpleIcon + Tooltip only)

## Date
2026-01-25
