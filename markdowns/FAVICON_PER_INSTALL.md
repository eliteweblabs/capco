# Per-Install Favicons

Favicons (`public/favicon.svg`, `public/favicon.png`) are **gitignored** and generated at build time so each install (Capco, Rothco, etc.) can have its own branding.

## Priority Order

1. **CMS Database** – `globalSettings.icon` (SVG markup) – overwrites `favicon.svg` when set  
2. **content/** – `content/favicon.svg` (client-specific, gitignored)  
3. **Default** – `public/favicon-default.svg` (committed fallback)

**PNG** is always generated from the final SVG at build time (512×512 via sharp). No separate PNG source.

## How It Works

- `prepare-favicons` runs first: copies SVG from `content/` or `favicon-default.svg`, generates `favicon.png` from it
- `process-manifest` runs next: if CMS has an icon, overwrites `favicon.svg` and regenerates `favicon.png`

## Adding a Client Favicon

**Via CMS (recommended):** Admin → Settings → set the *icon* field with SVG markup. Used for both HTML head, favicon.svg, and favicon.png.

**Via files:** Add `content/favicon.svg`. PNG is generated automatically. (content/ is gitignored; each deploy supplies its own when using branches or volumes.)
