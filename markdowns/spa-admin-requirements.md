# SPA for Admin / Project Routes — Requirements

## Current framework summary

- **Stack**: Astro, `output: "server"` (SSR), Node adapter, Tailwind, Flowbite, React (islands), Supabase.
- **Routing**: File-based. Each route is a full server-rendered page; every navigation is a full page load (no client-side router).
- **Layout**: One shared shell — `App.astro` — outputs full `<!doctype html><html>…<body>…</body></html>`. Project and admin pages use it by wrapping content in `<App …><Content /></App>`.
- **Auth**: Server-side on every request (`checkAuth(Astro.cookies)`), then redirect or render. Cookies forwarded for internal API calls.
- **Data**: Fetched in page frontmatter (and sometimes via internal `/api/*` from the server). No View Transitions or client-side routing in use.

So today: **multi-page app (MPA)** with a shared layout component, not a single-page app.

---

## What’s required to make project/_ and admin/_ a “true SPA”

Goal: **Client-side navigation** between project and admin routes (no full reload), with optional view-transition animations. The rest of the site (marketing, auth, etc.) can stay MPA.

### 1. Use Astro’s View Transitions + ClientRouter (no custom content loader for basic SPA)

- **You do not need to build a custom “content loader”** for basic SPA behavior. Astro’s `<ClientRouter />` already:
  - Intercepts same-origin `<a>` clicks and back/forward.
  - **Fetches the full HTML** of the target page (same URLs you have now).
  - Runs a **view transition** (optional), then **swaps** the document (head/body) with the new page.
- So the “loader” is built-in: **fetch next page HTML → parse → swap**. No extra content-loader layer unless you want a different strategy (e.g. JSON + client render).

### 2. Where to enable ClientRouter (admin/project only)

- ClientRouter must be in the **head** of the pages that participate in client-side routing (both origin and destination).
- **Recommended**: Enable it only for backend routes so the public site stays MPA:
  - **Option A**: Add `<ClientRouter />` inside `App.astro`’s `<head>`, but only when `isBackend` is true (e.g. `isBackend && <ClientRouter />`). All project/_ and admin/_ pages that use `App` with `isBackend` then get SPA navigation between themselves.
  - **Option B**: Introduce a dedicated **backend layout** (e.g. `LayoutBackend.astro`) that includes `<ClientRouter />` and wraps the same chrome (navbar, aside, etc.). Use this layout only for `project/*` and `admin/*` so only those routes use the client router.

### 3. Script re-execution after navigation

- With client-side routing, **bundled scripts run once**; **inline scripts** may or may not re-run when the DOM is replaced. So:
  - Any logic that must run on **every** page (e.g. theme, sidebar toggle, refresh manager) should either:
    - Run in response to **`astro:page-load`** (preferred), or
    - Use **`data-astro-rerun`** on inline scripts that must re-run every time.
  - You already have scripts that depend on `DOMContentLoaded` and globals (e.g. dashboard refresh manager). Those should be wrapped in a `document.addEventListener("astro:page-load", () => { … })` (and still run on first load) so they re-attach after each navigation.

### 4. Persisting shell (optional but nice)

- To avoid re-rendering navbar/sidebar on every admin/project navigation, you can use **`transition:persist`** on the persistent parts (e.g. main nav, aside) so the same DOM (and any client state) is kept across navigations. Then only the main content area is swapped. This is optional; full body swap still gives a real SPA experience.

### 5. Auth and redirects

- No change required for auth: the first load of any project/admin page is still server-rendered with `checkAuth`; unauthenticated users get a redirect. When navigating client-side, the router **fetches the new URL** (with cookies); the server still returns 200 + HTML or a redirect. If the server returns a redirect, you’d need to handle that in the client (e.g. `window.location` assign) or ensure admin/project URLs always return HTML when the user is logged in.

### 6. Fallback for older browsers

- Use `<ClientRouter fallback="swap" />` (or `"animate"`) so browsers without View Transitions API still get in-place content swap without a full reload.

---

## Do you need a custom “content loader”?

- **For “truly SPA” admin/project navigation**: **No.** The built-in behavior (fetch HTML → swap) is enough.
- **A custom loader** (e.g. via `astro:before-preparation` and replacing `event.loader`) is only needed if you want to:
  - **Change what is loaded**: e.g. fetch JSON from an API and render the “page” client-side instead of full HTML.
  - **Custom loading UI**: e.g. show a skeleton or progress bar during the fetch (you can also do this with `astro:before-preparation` / `astro:after-preparation` and the default loader).
  - **Optimize payload**: e.g. request a “partial” HTML or JSON and only update a content region (requires a custom swap as well).

So: **start with ClientRouter only**; add a custom content loader only if you later need a different data shape or loading UX.

---

## Minimal implementation checklist

1. **Enable ClientRouter** for backend only: in `App.astro` `<head>`, add `ClientRouter` when `isBackend` is true (or use a backend-only layout that includes it).
2. **Ensure all project/_ and admin/_ links are normal `<a href="...">`** (same origin). No `data-astro-reload` on those links unless you want a full reload for a specific case.
3. **Re-run critical scripts on navigation**: move one-off or per-page init (theme, sidebar, refresh manager, etc.) into `astro:page-load` (or use `data-astro-rerun` for inline scripts).
4. **Optional**: Add `transition:persist` on nav/sidebar and `transition:animate` on main content for smoother UX.
5. **Optional**: Use `astro:before-preparation` / `astro:after-preparation` for a loading indicator; no custom loader required unless you change what is fetched (e.g. to JSON).

After that, project/_ and admin/_ will behave as a true SPA (no full page reloads), with no custom content loader required for the basic case.
