# Audit: `<img>` vs Astro `<Image>`

## Summary

**Most `<img>` usage in this project is intentional and correct.** Astro's `<Image>` from `astro:assets` is not used. The project relies on dynamic URLs (Supabase, CMS, user uploads) and a custom lazy-loading system (`data-src` + IntersectionObserver), which is incompatible with Astro Image's build-time optimization model.

## When Astro `<Image>` Applies

| Scenario | Use `<Image>`? |
|----------|----------------|
| Local import from `src/assets/` | ✅ Yes – optimization, WebP, srcset |
| Static path in `public/` (e.g. `/images/hero.jpg`) | ✅ Yes – with width/height |
| Remote URL with known dimensions | ⚠️ Maybe – requires `image.remotePatterns` in config |
| Dynamic URL (DB, API, user upload) | ❌ No – Astro Image processes at build/SSR time |
| Custom lazy load (`data-src`) | ❌ No – Astro Image emits `src` directly |
| SVG | ❌ No – Import as component instead |
| Base64 / data: URI | ❌ No – Not supported |
| Client-rendered (innerHTML, template literal) | ❌ No – Image is server-component |

## Current Project Setup

- **No** `import { Image } from 'astro:assets'` anywhere
- **No** `image.remotePatterns` in `astro.config.mjs`
- **Custom** lazy loading: `lazyload` class + `data-src` + `lazy-load-images.ts`
- **Images** come from: Supabase storage, CMS, Unsplash, user avatars, API responses

## Component-by-Component

| Component | Pattern | Verdict |
|-----------|---------|---------|
| **ImageSlider** | `data-src`, lazy load, remote URLs | ✅ Correct – dynamic |
| **ContentBlock** | `data-src`, CMS images | ✅ Correct |
| **ImageBlock** | `data-src`, CMS/block images | ✅ Correct |
| **GalleryBlock** | `data-src`, CMS gallery | ✅ Correct |
| **FeaturedProjects** | `data-src`, project images | ✅ Correct |
| **HeroProject** | `data-src`, project featured | ✅ Correct |
| **LogoCloudBlock** | `data-src` or `src`, logos | ✅ Correct – external URLs |
| **FooterBlock** | `data-src`, logos | ✅ Correct |
| **TestimonialBlock** | `data-src`, avatars | ✅ Correct |
| **TeamBlock** | `data-src`, member photos | ✅ Correct |
| **AdminMedia** | `data-src`, Supabase files | ✅ Correct |
| **MediaFilter** | `data-src`, Supabase files | ✅ Correct |
| **Hero** | `src`, video poster | ✅ Correct – can be dynamic |
| **AdaptiveVideoPlayer** | `src`, poster | ✅ Correct |
| **UserIcon** | `src`, avatar URL | ✅ Correct – dynamic |
| **ProfileAvatarBlock** | `src`, user avatar | ✅ Correct – runtime |
| **ProjectPortfolio** | `src`, featured images | ✅ Correct |
| **ProjectPortfolioSocial** | `src`, featured images | ✅ Correct |
| **WhatSetsUsApartBlock** | `src`, CMS imageSrc | ✅ Correct |
| **Comment** | `src`, attachment URL | ✅ Correct |
| **Discussions** | `src`, avatar (template literal) | ✅ Correct |
| **FullScreenSlideshow** | `src`, slide URLs | ✅ Correct |
| **ProfileTeamSection** | `src`, avatar | ✅ Correct |
| **AIChatAgent** | `src`, preview (template) | ✅ Correct |
| **TabMarketing** | `src`, Supabase URL | ✅ Correct |
| **settings.astro** | `src`, OG image preview | ✅ Correct |
| **PDFSystem / voice-assistant** | `src`, base64/data URI | ✅ Correct – not Image-compatible |
| **GalleryBlock lightbox** | `src=""`, filled by JS | ✅ Correct |
| **__collapse.astro** | `src`, Flowbite logo (SVG) | ⚠️ Could import SVG as component |
| **__carousel.astro** | `src`, Flowbite SVGs | ⚠️ Could import SVG as component |
| **booth/** | Various | Legacy/demo – out of scope |
| **templates/** | Email, PDF | ✅ Correct – non-Astro |

## Missing Astro Standards (None Critical)

1. **`loading="lazy"`** – Astro Image adds this; custom lazy load handles it via `data-src`.
2. **`decoding="async"`** – Could be added to `<img>` for non-critical images.
3. **`width` / `height`** – Many images already have these for CLS; lazy-loaded ones use them.
4. **`alt`** – Should be present; a few avatars use empty or generic alt.

## When to Consider Astro `<Image>`

- New **static** images checked into the repo (e.g. marketing in `public/images/`).
- **Content collections** with image fields (Astro can process those).
- After adding `image.remotePatterns` for a fixed set of domains (e.g. Supabase) and ensuring dimensions are available at render time.

## Recommendation

**No changes required.** Current use of `<img>` is appropriate for:

- Dynamic/CMS/Supabase URLs
- Custom lazy loading (`data-src`)
- User avatars and runtime data
- Client-rendered content and templates

Adopting Astro `<Image>` would mean changing the lazy-loading approach and configuring remote patterns for many domains. The benefits would be limited given the current architecture.
