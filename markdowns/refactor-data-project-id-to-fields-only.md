# Refactor: Move data-project-id from `<tr>` to Refresh Fields Only

## Change Made

Removed `data-project-id` from the table row (`<tr>`) element and kept it **only on fields that have `data-refresh="true"`**.

## Why This Change?

1. **Cleaner DOM structure** - Only elements participating in the refresh system need the project ID
2. **More specific targeting** - Ensures refresh logic only affects actual data fields
3. **Prevents confusion** - The `<tr>` wasn't using `data-project-id` for any functionality

## Fields That Keep `data-project-id`:

All these fields have **both** `data-refresh="true"` AND `data-project-id`:

```astro
<!-- Punchlist complete -->
<span data-refresh="true" data-project-id={project.id} data-meta="punchlistComplete">

<!-- Punchlist count -->
<span data-refresh="true" data-project-id={project.id} data-meta="punchlistCount">

<!-- Created at -->
<span data-refresh="true" data-project-id={project.id} data-meta="createdAt">

<!-- Updated at -->
<span data-refresh="true" data-project-id={project.id} data-meta="updatedAt">

<!-- Due date input -->
<input data-refresh="true" data-project-id={project.id} data-meta="dueDate" />
```

## Other Elements That Keep `data-project-id`:

These elements need the project ID for their specific functionality:

```astro
<!-- Delete button -->
<SimpleIcon data-project-id={project.id} onclick="deleteProject(...)" />

<!-- Status link -->
<a data-project-id={project.id} data-status={project.status}>

<!-- Due date +/- buttons -->
<button data-project-id={project.id} onclick="adjustDueDate(...)">
```

## Script Update

Updated the inline script to find the projectId from a refresh field instead of the `<tr>`:

```typescript
// BEFORE:
const parentTr = currentScript?.closest("tr[data-project-id]");
const projectId = parentTr?.getAttribute("data-project-id");

// AFTER:
const parentTr = currentScript?.closest("tr");
const projectIdElement = parentTr?.querySelector("[data-project-id][data-refresh]");
const projectId = projectIdElement?.getAttribute("data-project-id");
```

## Files Modified

- `/src/components/project/ProjectItem.astro`
  - Removed `data-project-id={project.id}` from `<tr>` element
  - Updated script to query for `[data-project-id][data-refresh]` elements

## Result

✅ Cleaner markup - only refresh fields have the project ID
✅ More semantic - attributes match their actual usage
✅ Still fully functional - all refresh logic works the same

---

**Build completed at**: [timestamp from build output]
