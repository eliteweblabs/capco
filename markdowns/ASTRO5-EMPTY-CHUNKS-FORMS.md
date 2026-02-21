# Astro 5 production: forms/dropdowns not working — root cause

## What’s going on

In **production** (Astro 5 + `output: "server"`), the client build emits **“Generated an empty chunk”** for many `.astro` component scripts, including:

- `LoginForm.astro`
- `AuthProviders.astro`
- `StandardForm.astro`
- `MultiStepForm.astro`
- `Dropdown.astro`
- `Tooltip.astro`
- `flowbite-init`
- and dozens of others.

Those script chunks are **empty** (or effectively no-op). The HTML still references them, so the browser loads empty JS and nothing runs. Result: no form handlers, no dropdowns, no Google auth, etc. **No console errors** — the scripts just don’t run.

In **dev**, Astro serves component scripts differently (e.g. per-file script tags or different bundling), so the same code works.

## Root cause

Astro 5’s client build creates separate chunks for each `<script>` inside `.astro` components. For many of these, the chunk ends up **empty** (likely tree-shaking or client/server boundary). The chunk file is still emitted and linked from the page, so you get a script tag that loads an empty file.

This is a **build/output** issue, not a runtime or “event listener” issue. Adding more `DOMContentLoaded` handling or patches doesn’t fix it if the script file for that component is empty.

## What we changed

1. **LoginForm**  
   The login form script was moved into a **separate `.ts` file** (`login-form-client.ts`) and loaded with `<script client:load src="./login-form-client.ts">`. That file is bundled as a normal module, so its chunk has real code. Login form and Google OAuth on the login page should work again in production.

2. **Console interceptor**  
   Disabled in production so it can’t affect script execution.

3. **Auth “refresh token already used”**  
   Logging for that case was removed to cut server log noise.

## What you can do for other broken UI

- **Option A – Move script to `.ts` and load with `src`**  
  For any other component that’s critical and currently has an empty chunk, move its `<script>` body into a `.ts` file and use `<script client:load src="./that-file.ts">`. That way the chunk is built from the `.ts` module and won’t be one of the empty Astro script chunks.

- **Option B – Downgrade to Astro 4**  
  If you need many components to work without refactors, pin Astro to 4.x (e.g. `"astro": "4.15.12"`) and use adapter/integration versions that match Astro 4. Then rebuild and redeploy; the empty-chunk behavior is an Astro 5 client build issue.

- **Option C – Inline with `is:inline`**  
  For very small scripts with **no** imports, you can use `<script is:inline>` so the script is in the HTML and doesn’t go through the empty-chunk pipeline. Not suitable for scripts that need `import` (e.g. Supabase).

## Build warning to watch for

When you run `astro build`, look for:

```text
[WARN] [vite] Generated an empty chunk: "SomeComponent.astro_astro_type_script_index_0_lang".
```

Any component listed there is at risk of “no behavior” in production until its script is moved to a `.ts` module (Option A) or you’re off Astro 5 (Option B).
