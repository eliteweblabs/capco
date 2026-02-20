# App.astro Comment Block Fix (Production HTML Corruption)

## Problem

Production at https://capcofire.com/ showed:
- Raw Astro/JSX leaking into the HTML: `{/* SPA disabled`, `document.addEventListener("astro:after-swap"`, `} -->`
- Broken page structure; theme, nav, forms didn't work
- Localhost worked; production did not

## Root Cause

In `App.astro` (lines 885–908) there was an HTML comment wrapping mixed content:

```astro
<!-- {/* {isBackend && (
    ...
    document.addEventListener("astro:after-swap", function reapplyCmsColors() { /* no-op */ 
    ...
)} */}
```

1. **Nested `/* no-op */`** – The inner `*/` closed the outer `{/*` early.
2. **HTML `-->`** – Could end the HTML comment prematurely.
3. The rest of the block was emitted as raw text, breaking the page.

## Fix

Removed the entire block and replaced with a single Astro comment:

```astro
{/* SPA disabled: CMS colors, ClientRouter, TRANSITION_BEFORE_PREPARATION - see git history if needed */}
```

(Commit: the block was all disabled SPA code.)

## Deployment

1. Push to GitHub (Railway deploys from the repo).
2. Wait ~6 minutes for deploy.
3. Verify at https://capcofire.com/ – DevTools → Network: `/_astro/*.js` and `/_astro/*.css` should be 200.
