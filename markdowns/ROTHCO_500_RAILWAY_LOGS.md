# Rothco Internal Server Error – Railway Logs Analysis

**Date:** 2026-03-03  
**Status:** Investigating

## Error from Rothco deploy logs

```
[ERROR] [@astrojs/node] Could not render /
TypeError: Response body object should not be disturbed or locked
    at extractBody (node:internal/deps/undici/undici:6274:17)
    at new Request (node:internal/deps/undici/undici:10626:48)
    at NodeApp.createRequest (file:///app/dist/server/chunks/_@astrojs-ssr-adapter_CbYtC1xQ.mjs:1256:21)
    ...
    at SendStream.onStatError (/app/node_modules/send/index.js:315:12)
```

## What’s happening

1. `SendStream.onStatError` – the static file server (`send`) fails when it can’t find a file.
2. In the error path, the adapter tries to create a web `Request` from the Node request.
3. By then the request/response body has already been consumed, causing "body disturbed or locked".

## Likely causes

- Static file handling for `/` or another path fails (e.g. root path, favicon).
- When that fails, the adapter reuses the incoming request, whose body was already read.
- Rothco’s deployment may differ from Capco (domains, redirects, routing).

## Log pattern observed

Frequent `[---REDIRECT] www to non-www: { from: 'www.rothcollc.com', to: 'rothcollc.com' }` – suggests www traffic is being redirected, possibly at proxy/DNS level before it reaches the app.

## Suggested steps

1. **Redeploy Rothco** – Sometimes fixes transient issues.
2. **Compare env vars** – Rothco vs Capco in Railway.
3. **Domain / www redirect** – Ensure `rothcollc.com` and `www.rothcollc.com` are correctly configured in Railway / Cloudflare so redirects don’t produce odd request patterns.
4. **Check favicon / root** – Confirm `/favicon.ico`, `/`, and other root paths are served correctly (no missing static files or broken routes).

## Commands used

```bash
railway link -p 4916c281-46ed-44ee-8169-71a61c27d8a7 -e production -s rothcollc-website
railway logs -d --lines 200
```

## Capco vs Rothco

- **Capco:** `RAILWAY_PUBLIC_DOMAIN` – working.
- **Rothco:** `rothcollc.com` – 500 on `/` (502 Bad Gateway observed when fetching).
