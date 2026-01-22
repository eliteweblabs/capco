# Banner Alert Architecture Refactor

## Problem
Top banner alerts were causing layout issues on mobile - the navbar would initially position correctly below the banner, then "jump" back to the top of the viewport, covering the banner.

### Root Cause
Two separate fixed-position elements (`#top-banner-container` and `nav.fixed`) were fighting each other:
1. Banner positioning script would calculate banner height and push navbar down
2. Safari fix in App.astro would reset navbar to `top: 0` 
3. Complex timing issues with multiple scripts trying to coordinate positioning
4. Race conditions between DOMContentLoaded, page load, and various timeouts

## Solution
**Move banner alerts INSIDE the navbar structure** instead of positioning them separately.

### Architecture Changes

#### Before:
```
<body>
  <BannerAlertsLoader position="top" /> <!-- fixed, z-60 -->
  <Navbar /> <!-- fixed, z-50, positioned via scripts -->
  <main>...</main>
</body>
```

#### After:
```
<body>
  <Navbar> <!-- fixed, z-50 -->
    <BannerAlertsLoader position="top" /> <!-- relative, inside nav -->
    <div>navbar content</div>
  </Navbar>
  <main>...</main>
</body>
```

### Benefits
1. **No positioning scripts needed** - Nav naturally expands to contain banner
2. **No z-index conflicts** - Single fixed element hierarchy
3. **No Safari fix complications** - Safari fix only affects the nav container, not positioning
4. **No timing issues** - Banner is part of nav's DOM structure
5. **Simpler maintenance** - One fixed container instead of two coordinated ones
6. **Better semantics** - Banner is logically part of header/navigation area

### Files Modified
- `src/components/ui/Navbar.astro` - Changed to flex-col container, includes BannerAlertsLoader
- `src/features/banner-alert/components/BannerAlertsLoader.astro` - Removed all positioning scripts, changed to relative positioning
- `src/components/ui/App.astro` - Removed top BannerAlertsLoader (now in Navbar), reverted Safari fix to simple version

### Technical Details
- Navbar changed from single-row flex to flex-col container
- Banner container changed from `fixed top-0 z-[60]` to `w-full flex-col` (relative positioning)
- Removed ~60 lines of complex positioning JavaScript
- Safari fix no longer needs banner-aware logic

## Testing Notes
- Test on mobile (especially iOS Safari)
- Test banner dismissal animations
- Test with/without banners
- Test Astro page transitions
- Verify bottom banners still work (they remain fixed separately)
