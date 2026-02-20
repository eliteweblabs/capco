# Astro SSR Portable Build Fix

## Problem

When using Astro with SSR (Node adapter), the built `entry.mjs` embeds **absolute file paths** from the machine where the build ran (e.g. `file:///Users/you/project/dist/client/`). 

On Railway (or any deployment), the app runs at a different path (e.g. `/app`). The static file handler looks for assets at the hardcoded path, which doesn't exist → **all `/_astro/*.js` and `/_astro/*.css` return 404**. Result: theme toggle, speed dial, sidebar, forms, and all client-side JavaScript fail to load.

## Solution

`scripts/fix-entry-paths.cjs` runs automatically after every build. It patches `dist/server/entry.mjs` to resolve `client` and `server` paths **at runtime** relative to the entry file:

```javascript
// Before (broken on Railway):
"client": "file:///Users/4rgd/.../dist/client/",
"server": "file:///Users/4rgd/.../dist/server/",

// After (portable):
const __entryDir = path.dirname(fileURLToPath(import.meta.url));
"client": "file://" + path.join(__entryDir, "..", "client") + "/",
"server": "file://" + __entryDir + "/",
```

## When It Runs

- `npm run build` → astro build → fix-entry-paths
- `npm run build:railway` → astro build → fix-entry-paths

## Verification

After deploy, open DevTools → Network, reload the page. `/_astro/*.js` and `/_astro/*.css` should return 200, not 404.
