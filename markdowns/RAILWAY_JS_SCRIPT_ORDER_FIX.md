# Why Railway JS Broke (Hamburger + Dropdown) — Root Cause

## What was going wrong

On **production (Railway)** the hamburger didn’t open the sidebar and the account dropdown looked wrong. On **localhost** everything worked.

The earlier “fixes” were workarounds, not root cause:

- **Sidebar:** Re-running sidebar init from `App.astro` on `DOMContentLoaded` — papered over the fact that init was running at the wrong time.
- **Dropdown:** Extra CSS (`right-0 top-full`, `min-w-[18rem]`) — papered over Flowbite/popover running at the wrong time.

## Actual cause: Astro script order in production

In **production builds**, Astro **reverses the order** of multiple `<script>` (and `<style>`) tags. So scripts run in the **opposite** order to how they appear in the source.

- **Dev:** Scripts tend to run in a more predictable / source-like order.
- **Production:** With reversed order, things like `flowbite-init` and the ToggleSidebar script can run **before** the DOM or other scripts they depend on are ready, or in an order that breaks Flowbite’s popover setup.

So it wasn’t “scripts run before #sidebar exists” in a streaming sense — it was **wrong execution order** in the built page (reversed scripts), which only shows up in production.

## Real fix

Use Astro’s flag so production keeps the same script order as source:

**`astro.config.mjs`:**

```js
export default defineConfig({
  experimental: {
    preserveScriptOrder: true,
  },
  // ...
});
```

- **Added in:** Astro 5.5.0.
- **Effect:** Scripts (and styles) in the built HTML keep declaration order, so execution order matches dev and sidebar + Flowbite run in the right order.

After enabling this:

- The **sidebar toggle** works because its init runs in the correct order relative to the rest of the page.
- The **dropdown** is positioned correctly because Flowbite runs after the DOM and can attach popovers properly.

## What was reverted

- **App.astro:** Removed the `__ensureSidebarInit()` call and its 200ms retry.
- **ToggleSidebar.astro:** Removed `window.__ensureSidebarInit` and the comment about Railway.
- **Dropdown.astro:** Restored original panel classes (`w-full`, no `right-0 top-full mt-1 min-w-[18rem] rounded-lg shadow-xl`).

No fake fixes — the only behavioral change is **`experimental.preserveScriptOrder: true`**.

## If it still breaks

Then the cause is likely something else, e.g.:

- A script chunk **404** or failing to load on Railway (wrong base path, CDN, or deploy).
- A **CSP** or security header blocking or altering script execution.
- **Flowbite** or another lib failing in prod (e.g. missing global, different env).

In that case, use the Railway JS debug flow (see `RAILWAY_JS_DEBUG.md`) to see which scripts load and in what order, and whether any errors are thrown.
