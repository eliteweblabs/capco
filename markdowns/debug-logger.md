# Debug Logger

Toggleable function-call logging for development. Zero overhead when disabled.

## Enabling / Disabling

| Method | Example | Persists |
|--------|---------|----------|
| URL param | `?debug=1` | No (reload clears) |
| URL with categories | `?debug=multistep,form` | No |
| localStorage | `localStorage.setItem("debug","1")` | Yes |
| Console | `window.__DEBUG = true` | No (reload clears) |

**Disable:** `Debug.disable()` or `localStorage.removeItem("debug")`

## Usage

### 1. Manual log

```ts
if (window.Debug?.enabled("form")) {
  Debug.log("form", "handleSubmit", [formData]);
}
// Or let log() no-op when disabled:
Debug.log("form", "handleSubmit", [formData], result, 12);
```

### 2. Wrap a function (auto-log calls, args, result, duration)

```ts
const handleClick = (e: Event) => { ... };
const wrapped = Debug.wrap(handleClick, { category: "multistep", name: "handleClick" });
element.addEventListener("click", wrapped);
```

### 3. Grouped output

```ts
Debug.group("Processing step 2", "form", () => {
  // ... nested logs appear under the group
});
```

## Categories

Use categories to filter noise. With `?debug=multistep`, only logs whose category is `multistep` appear.

Common categories: `form`, `multistep`, `modal`, `auth`, `api`

## Best practices

- **Opt-in only** – wrap or log only functions you care about; no global patching
- **Categories** – use consistent category names per feature area
- **Avoid hot paths** – don’t wrap high-frequency handlers (e.g. mousemove) without filtering
- **Keep args small** – large objects are truncated (~200 chars) to avoid console spam

## Integration

`Debug` and `formFailureLog` are attached to `window` by `app-globals.ts`. Available as `window.Debug` or `window.formFailureLog` in any script that runs after app-globals.

## Form Failure Log (Monitorable)

`formFailureLog()` is **always-on** and independent of the debug toggle. Use it when a form fails to submit:

```ts
formFailureLog({
  formId: form.id,
  formAction: form.action,
  error: err.message,
  statusCode: 500,  // optional
  context: { handler: "multistep", step: 2 },
});
```

- Logs to console, localStorage buffer, and POST to `/api/log/form-failure`
- Stored in Supabase `formFailureLogs` table
- Admins can review at **Admin → Form Failure Logs**
