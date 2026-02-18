# Retina Display Audit

## Summary

Audit of image handling across the project for high-DPI (retina) displays. On 2x/3x screens, images need ~2x resolution to avoid blurriness when displayed at 1:1 CSS pixels.

## Fixes Applied

### ImageSlider.astro ✅
- **Default images**: Bumped Unsplash from `w=800` to `w=1600` (2x)
- **srcset support**: Added `data-srcset` with 1x/2x variants for Unsplash URLs via `getRetinaSrcSet()`
- **Lazy loader**: Updated `lazy-load-images.ts` to set `srcset` when `data-srcset` is present
- **CSS**: Added `min-width: 100%; min-height: 100%` to prevent 50% sizing; `image-rendering: auto`
- **Intrinsic dimensions**: Updated to 1600×1200 for proper aspect ratio

### New: src/lib/image-retina.ts
- `getRetinaImageUrl(url)` - Doubles `w` param for Unsplash URLs; returns original for others
- `getRetinaSrcSet(url, baseWidth)` - Returns `"url1x 1x, url2x 2x"` for Unsplash

## Components Audited

| Component | Status | Notes |
|-----------|--------|-------|
| **ImageSlider** | ✅ Fixed | Retina srcset, 2x defaults |
| **InsetBgFade** | ✅ Fixed | Applies getRetinaImageUrl to all background URLs (Unplash 2x) |
| **FullScreenSlideshow** | ⚠️ Monitor | Uses `img` with `object-contain`; URLs from props |
| **GalleryBlock** | ⚠️ Monitor | CMS/Supabase images; width/height intrinsic only |
| **ImageBlock** | ⚠️ Monitor | CMS images; no URL transformation |
| **ContentBlock** | ⚠️ Monitor | Same |
| **FeaturedProjects** | ⚠️ Monitor | Project images from API |
| **HeroProject** | ⚠️ Monitor | Same |
| **LogoCloudBlock** | ⚠️ Low priority | Logos; often SVG or small |
| **AdminMedia** | ℹ️ Thumbnails | `image-rendering: crisp-edges` for grid; intentional |
| **ProjectPortfolio** | ℹ️ Thumbnails | Same |

## Guidelines for New Components

1. **Unsplash/demo images**: Use `w=1600` or higher for hero-sized; `w=800` for thumbnails
2. **User-uploaded images**: Consider Supabase image transforms (`/render/image/...?width=`) or a CDN
3. **Lazy-loaded img**: Add `data-srcset` when URL supports it; lazy loader will apply
4. **Background images**: Apply `getRetinaImageUrl()` when building style URLs
5. **Avoid** `image-rendering: crisp-edges` on photos (use only for pixel art/thumbnails)

## CMS / Config

- `config.json` ImageSlider shortcode: Some use `w=1920`, others `w=800`. Prefer `w=1600`+ for hero.
- CMS media: Stored URLs are as-uploaded; retina requires transform layer (Supabase, imgix, etc.)
