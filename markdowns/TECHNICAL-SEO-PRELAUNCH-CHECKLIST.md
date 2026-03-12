# Technical SEO Pre-Launch Checklist

This checklist targets common implementation issues that hurt crawlability and CTR:

- Heading hierarchy
- Icon-only links without accessible text
- Missing/duplicate meta descriptions
- Canonical mismatches
- Missing `alt` text on images

## Current Project Snapshot (2026-03-11)

### 1) Heading hierarchy

Findings:

- `src/pages/privacy.astro` uses `<h3>` immediately after `<h1>` before any `<h2>`.
- `src/pages/terms.astro` uses `<h3>` immediately after `<h1>` before any `<h2>`.
- `src/pages/admin/calendar.astro` contains two `<h1>` elements.

Action:

- Keep one `<h1>` per page template.
- Prefer `h1 -> h2 -> h3` nesting in order.
- For "Last updated ..." labels, use `<p>` or `<div>` instead of `<h3>`.

### 2) Icon-only links with no readable text

Findings:

- `src/components/ui/Footer.astro` has an empty anchor:
  - `<a href="/" class="overscroll-scale cms-logo-mask h-12 w-12 shrink-0"></a>`

Action:

- Add `aria-label`, and preferably visible text or sr-only text:
  - `aria-label="Home"`
  - `<span class="sr-only">Home</span>`

### 3) Meta descriptions

Status:

- Canonical `<meta name="description">` exists centrally in `src/components/ui/AppHead.astro`.
- Many pages inherit description from `description || globalCompanySlogan` in `src/components/ui/App.astro`.

Risk:

- Pages without explicit descriptions can share the same global slogan (duplicate SERP snippets).

Action:

- Set per-page descriptions for major marketing pages and top conversion pages.

### 4) Canonical tags

Status:

- Canonical is emitted from `src/components/ui/AppHead.astro` using `canonicalUrl`.

Risk:

- If both `www` and apex are publicly reachable without redirect, crawlers can see duplicates.

Action:

- Enforce one preferred host (either apex or `www`) with permanent redirects.
- Keep canonical host aligned with redirect target.

### 5) Image alt text

Findings (empty `alt` examples):

- `src/pages/shop/cart.astro`
- `src/pages/admin/settings.astro`
- `src/components/blocks/GalleryBlock.astro` (lightbox image placeholder)

Action:

- Keep empty `alt` only for purely decorative images.
- Add meaningful alt text for product/content images.

## DNS / SSL Note (Railway)

If browser shows "This connection is not private" on production:

- Ensure domain is added in Railway service networking (both apex + `www` if used).
- Ensure DNS points correctly:
  - `A @ -> 66.33.22.191`
  - `CNAME www -> <service>.up.railway.app`
- Wait for cert issuance and propagation.

`rothco.railway.internal` is internal/private and not used for public DNS.

## Recommended Launch Gate

Before each production launch:

1. Run heading audit on public pages.
2. Validate no empty/icon-only links without labels.
3. Ensure key pages have unique meta descriptions.
4. Confirm canonical + redirect host strategy.
5. Spot-check image `alt` quality on top pages.
6. Verify SSL cert status on apex and `www`.
