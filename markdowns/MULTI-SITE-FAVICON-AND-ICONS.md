# Multi-Site Favicon and App Icons

This repo is used for multiple sites (e.g. Capco, Rothco). Favicons and apple-touch icons are handled so each deployment can have its own branding without code changes.

## How It Works

1. **Single codebase** – All icon requests go through API routes that either serve from the database or redirect to static files.
2. **Per-site options** – Each site can use (a) static files in `public/`, or (b) database/globalSettings, or (c) a custom URL in settings.

## Endpoints

| URL | Purpose | Behavior |
|-----|---------|----------|
| `GET /api/favicon.svg` | Favicon (SVG) | Serves `globalSettings.icon` (SVG markup) if set, **transformed** (primary color fill + padding for apple-touch); otherwise redirects to `/favicon.svg`. |
| `GET /api/favicon.png` | Favicon PNG / Apple Touch Icon | Redirects to `globalSettings.faviconPngUrl` if set (full URL or path); otherwise redirects to `/favicon.png`. |

## Favicon transform (primary color + padding)

When the icon comes from the CMS/DB, it is passed through `transformSvgForFavicon` so that:

- **Fill color** – Black, `#000`, `currentColor`, and theme-dependent styles (e.g. `.fill { fill: #000 }`) are replaced with the site **primary color** (`primaryColor` / `GLOBAL_COLOR_PRIMARY`). The icon looks correct in all contexts (browser tab, apple-touch, light/dark).
- **Padding** – The graphic is scaled to 90% and centered so it is not edge-to-edge on apple-touch icons.

The same transform is applied at build time when `process-manifest` writes `public/favicon.svg` from the DB icon, so the generated `favicon.png` also has primary color and padding.

## Per-Site Setup

### Option A: Static files (recommended for most deployments)

Put your assets in `public/` (these files are gitignored so each site can have different ones):

- **`public/favicon.svg`** – Used when no DB icon is set (API redirects here).
- **`public/favicon.png`** – Used for apple-touch and manifest PNG icons (API redirects here). Prefer at least 192×192 and 512×512 for PWA.

No config needed; the APIs redirect to these paths.

### Option B: Database (globalSettings)

- **`icon`** – SVG markup (string). If set, `/api/favicon.svg` serves it directly; no static file needed.
- **`faviconPngUrl`** – Optional. Full URL (e.g. `https://cdn.example.com/icon.png`) or path (e.g. `/img/favicon.png`). If set, `/api/favicon.png` redirects here instead of `/favicon.png`.

### Option C: Mix

- Use DB `icon` for SVG and static `public/favicon.png` for PNG, or the reverse. The APIs always prefer DB/config when set, then fall back to static paths.

## Where Icons Are Used

- **App.astro** – `<link rel="icon">`, `<link rel="apple-touch-icon">`, `<link rel="mask-icon">` use `/api/favicon.svg` or data URI (from DB icon) and `/api/favicon.png`.
- **manifest.json** (dynamic route) – Manifest icons point to `/api/favicon.svg` and `/api/favicon.png`.
- **LayoutAuthCallback.astro** – Uses `/api/favicon.svg` for the auth callback page.

## Gitignore

`public/favicon.png` and `public/favicon.svg` are in `.gitignore` so each deployment can commit different content or rely on build/deploy steps to add them. Do not remove these from gitignore if you use per-site static favicons.
