# Vite + Astro SSR / client — what broke the site

## Symptom: dev shows 500, “require is not defined” (`gray-matter`)

`astro.config.mjs` had:

```js
build: {
  rollupOptions: {
    external: (id) => id === "gray-matter",
  },
},
```

That **externalized `gray-matter` for SSR as well**. In dev/SSR, Vite loads it as an ES module; `gray-matter` is CJS and calls `require` → **`ReferenceError: require is not defined`**.

**Fix:** remove this `rollupOptions.external` block. `gray-matter` is only used from server code (`src/lib/content.ts`); Astro does not need it forced external for the client bundle.

## Symptom: empty `/_astro/hoisted.*.js` (1 byte) in production

**Do not** put `{ noExternal: true }` under `vite.build.ssr` — in Vite, `build.ssr` is not that object. It broke client hoisted output.

**Fix:** delete that mistaken `build.ssr` key entirely.

## Symptom: `module is not defined` in browser (`cssesc`, UMD CDNs)

- Blanket `vite.ssr.noExternal: true` inlined CJS-only deps (e.g. `cssesc`) into SSR in a bad way.
- `<script src="https://…umd.js">` without `is:inline` became `import "https://…"` in hoisted bundles → UMD expecting `module`.

**Fixes:** avoid `noExternal: true` unless a specific deploy error requires a **narrow** `ssr.noExternal: ['one-package']`; use `is:inline` on CDN UMD `<script>` tags.

## Current stable shape (summary)

- `vite.build`: `target`, `assetsInlineLimit` only (no `rollupOptions.external` for gray-matter).
- No `vite.ssr` block unless Railway proves a specific package must be bundled.

Verify locally:

1. `npm run dev` → open `/` → should be **200**, not 500.
2. `npm run build && PORT=3000 node dist/server/entry.mjs` → `curl -sI http://127.0.0.1:3000/_astro/hoisted.*.js` → size **≫ 1 byte**.
