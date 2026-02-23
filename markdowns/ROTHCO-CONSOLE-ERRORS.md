# Rothco Console Errors – Summary & Fixes

Captured via Puppeteer on https://rothco-firstbranch.up.railway.app/ (2025-02-22).

## Fix Applied (2025-02-22)

**Root cause:** Malformed HTML comment block in `App.astro` (lines 324–348) was corrupting the output. The block mixed `<!-- -->` HTML comments with `{/* */}` JSX comments and contained raw Astro template syntax (`set:html={JSON.stringify({`) that was leaking into the served HTML. This caused:

1. Script tags to have invalid/malformed content
2. "Cannot use import statement outside a module" (scripts with ES module syntax executed as classic scripts due to broken HTML structure)
3. "Unexpected token ':'" / "Unexpected identifier 'as'" (TypeScript in wrong context)

**Fix:** Removed the malformed comment block and replaced with a single clean `{/* ... */}` comment.

**Bonus:** Added `chat` icon to `icon-data.json` (alias of message-circle) so `[icon:chat]` in CMS content renders correctly instead of fallback text.

---

## Errors Captured (Before Fix)

### 1. Page errors (10 script syntax errors)

| # | Error | Likely cause |
|---|-------|--------------|
| 1–6, 8–10 | `Cannot use import statement outside a module` | Script tags without `type="module"` emitting ES module syntax |
| 2, 6–7 | `Unexpected token ':'` / `Unexpected identifier 'as'` | TypeScript syntax (types, `as` casts) in classic scripts |

### 2. Warnings (3)

- **markdownToSafeHTML**: "should not be imported on the client side"
- **Zustand**: "Use `createWithEqualityFn` instead of `create`"
- **react-i18next**: "You will need to pass in an i18next instance"

## Root cause

Some scripts are emitted as classic scripts but contain ES module syntax (`import`) and/or TypeScript. That usually means:

1. Astro client chunks are loaded without `type="module"`
2. A build step or third-party script outputs ES module code as a non-module script
3. A React-related dependency (e.g. `@studiocms/ui`) injects scripts that assume modules

## Next steps / fixes

1. **Inspect production HTML** – Check the built page source for `<script>` tags and confirm all those with `import` or module syntax have `type="module"`.
2. **React integration** – `@astrojs/react` is in package.json but not in `astro.config.mjs` integrations. If React components are used, add the React integration so Astro handles their output correctly.
3. **Client imports** – Ensure `markdownToSafeHTML` (or equivalent) is only used in server-only code; wrap or gate it so it is not bundled for the client.
4. **Zustand / react-i18next** – Update usage or versions as needed; these are mostly noise but can be fixed by following the library migration guides.

## Capture script

Run locally:

```bash
node scripts/capture-console-errors.js https://rothco-firstbranch.up.railway.app/
node scripts/capture-console-errors.js --all   # Include all message types
```
