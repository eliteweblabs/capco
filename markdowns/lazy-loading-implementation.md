# Lazy Loading Images Implementation

## Summary
Implemented Astro-native lazy loading for all images throughout the project to improve performance and reduce initial page load times.

## What Was Done

### 1. Created Global Lazy Loading Utility
- **File**: `src/scripts/lazy-load-images.ts`
- **Features**:
  - IntersectionObserver-based lazy loading
  - Zero dependencies (Astro-native)
  - Automatic initialization on DOMContentLoaded
  - Fallback for older browsers
  - Error handling for failed images

### 2. Added Global CSS Styles
- **File**: `src/styles/global.css`
- **Added**:
  - `.lazyload` - Images waiting to load (opacity: 0)
  - `.lazyloading` - Images currently loading (transition)
  - `.lazyloaded` - Successfully loaded images (opacity: 1)
  - `.blur-sm` - Optional blur placeholder effect
  - `.lazyerror` - Error state for failed images

### 3. Integrated into Main Layout
- **File**: `src/components/ui/App.astro`
- Added lazy loading script import to run globally on all pages

### 4. Updated Components

#### ✅ Fully Updated Components:
1. **AdminMedia.astro** - Media manager thumbnails ✅
2. **FeaturedProjects.astro** - Project featured images ✅
3. **HeroProject.astro** - Project hero background images ✅
4. **ImageSlider.astro** - Slider images ✅
5. **ImageBlock.astro** - Image block component ✅
6. **GalleryBlock.astro** - All gallery variants (grid, featured, masonry, carousel) ✅
7. **TestimonialBlock.astro** - Testimonial avatars ✅
8. **ContentBlock.astro** - Content images (top, left, right, bottom) ✅
9. **LogoCloudBlock.astro** - Logo images (all variants) ✅
10. **TeamBlock.astro** - Team member photos ✅
11. **FooterBlock.astro** - Footer logos ✅

#### 🔄 Intentionally Skipped:
- **Lightbox images** - Dynamically loaded via JavaScript, functioning correctly

#### 📝 Remaining Components (if any):
Check for any remaining images:
```bash
rg '<img' --type astro src/components/
```

## How to Use

### For New Images

Replace:
```astro
<img 
  src={imageUrl} 
  alt="Description"
  loading="lazy"
/>
```

With:
```astro
<img 
  data-src={imageUrl} 
  alt="Description"
  class="lazyload blur-sm"
  width="800"
  height="600"
/>
```

### Key Changes:
1. **`src` → `data-src`** - Image URL goes in data attribute
2. **Add `class="lazyload blur-sm"`** - Enables lazy loading with blur effect
3. **Add `width` and `height`** - Prevents layout shift (use approximate dimensions)
4. **Remove `loading="lazy"`** - No longer needed (handled by script)

## Benefits

1. **Performance**: Only loads images when they enter the viewport
2. **Bandwidth**: Reduces initial page load size
3. **UX**: Smooth blur-to-clear transition
4. **SEO**: Better Core Web Vitals scores
5. **Layout Stability**: Width/height prevents CLS (Cumulative Layout Shift)

## Browser Support

- Modern browsers: Full IntersectionObserver support
- Older browsers: Automatic fallback (loads all images immediately)

## Configuration

The lazy loading script uses these default settings:
- **rootMargin**: `50px 0px` - Start loading 50px before visible
- **threshold**: `0.01` - Trigger when 1% of image is visible

## Testing

To test lazy loading:
1. Open Chrome DevTools → Network tab
2. Throttle network to "Slow 3G"
3. Scroll through the page
4. Watch images load only when they come into view

## Next Steps

Continue updating remaining components with `<img>` tags:
- Block components (Gallery, Image, Testimonial, etc.)
- Avatar components
- Footer logos
- Other miscellaneous images

Use grep to find remaining instances:
```bash
rg '<img' --type astro src/
```
