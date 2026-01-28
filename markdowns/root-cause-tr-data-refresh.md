# Root Cause: `<tr>` Had `data-refresh="true"`

## The Real Bug

The `<tr>` element (the entire project row) had `data-refresh="true"`:

```astro
<tr
  data-refresh="true"  ← THIS WAS THE BUG!
  data-project-id={project.id}
>
```

## Why This Caused Multiple Icons

The CSS looked for elements with `data-refresh="true"`:

```css
.relative:has(input[data-refresh="true"][data-edited="true"])::after {
  /* Show save icon */
}
```

When the `<tr>` had `data-refresh="true"`, it might have been matching certain CSS selectors or getting `data-edited` applied incorrectly.

## The Fix

Removed `data-refresh="true"` from the `<tr>` element:

```astro
<tr
  data-project-status={statusSlugOrId}
  data-project-id={project.id}
  data-hidden={isHidden ? "true" : undefined}
>
```

Now only ACTUAL editable fields have `data-refresh="true"`:
- Due date input
- Punchlist count spans (read-only, for auto-refresh)
- Created/Updated date spans (read-only, for auto-refresh)

## Files Modified

- `/src/components/project/ProjectItem.astro` - Removed `data-refresh="true"` from `<tr>` tag

## Testing

1. Hard refresh (Cmd+Shift+R)
2. Click +/- on ONE project's due date
3. Should see ONLY ONE save icon (next to that specific field)
4. No icons on other projects or other fields

---

**This was the root cause of the multiple icons issue - the `<tr>` shouldn't have had `data-refresh="true"` in the first place.**
