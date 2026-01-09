# Logo & Content Management Solution Proposal

## Current Problem
- Base64 PNG logos can't change colors with CSS filters
- Logo appears black in dark mode
- Environment variables are cumbersome for large content
- Need better content management system

## Solution Options (Ranked by Ease)

### ✅ Option 1: Use SVG Logos (SIMPLEST - Do This First)

**Why SVG?**
- SVGs can be styled with CSS (change colors, opacity, etc.)
- Perfect for light/dark mode switching
- No CMS needed - just update the SVG markup

**How It Works:**
1. Convert your PNG logo to SVG (or get SVG version from designer)
2. Store SVG markup in `GLOBAL_COMPANY_LOGO_SVG` environment variable
3. Use CSS to change SVG colors based on theme

**Implementation:**
```astro
<!-- Logo.astro -->
<svg class="logo-svg" viewBox="0 0 200 60">
  <path fill="currentColor" d="..."/>
</svg>

<style>
  .logo-svg {
    color: #000000; /* Black in light mode */
  }
  .dark .logo-svg {
    color: #ffffff; /* White in dark mode */
  }
</style>
```

**Pros:**
- ✅ Works immediately
- ✅ No CMS needed
- ✅ Perfect theme switching
- ✅ Small file size

**Cons:**
- ⚠️ Need SVG version of logo

---

### ✅ Option 2: Supabase Storage (You Already Have This!)

**Why Supabase Storage?**
- You already have Supabase configured
- Store logo files (PNG/SVG) in Supabase Storage
- Reference via URL instead of base64
- Can upload different versions for light/dark mode

**How It Works:**
1. Upload logos to Supabase Storage bucket: `logos`
2. Store URLs in environment variables or database
3. Reference URLs in components

**Implementation:**
```typescript
// Store in Supabase Storage
const logoLightUrl = "https://your-project.supabase.co/storage/v1/object/public/logos/logo-light.svg";
const logoDarkUrl = "https://your-project.supabase.co/storage/v1/object/public/logos/logo-dark.svg";

// Use in component
<img src={logoLightUrl} class="dark:hidden" />
<img src={logoDarkUrl} class="hidden dark:block" />
```

**Pros:**
- ✅ Already have Supabase
- ✅ Easy to update (just upload new file)
- ✅ Can use PNG or SVG
- ✅ No code changes needed

**Cons:**
- ⚠️ Requires Supabase Storage setup
- ⚠️ Need to manage file uploads

---

### ✅ Option 3: Full CMS Integration (Best Long-Term)

**Options:**
1. **Storyblok** (Official Astro partner) - Visual editor, great UX
2. **Hygraph** - GraphQL API, powerful
3. **Supabase CMS** (Custom) - Use your existing Supabase

**Why CMS?**
- Visual editor for non-technical users
- Manage all content (logos, pages, settings) in one place
- No environment variable limits
- Version control built-in

**Recommended: Storyblok**
- Official Astro integration
- Free tier available
- Visual editor
- Component-based (matches Astro)

**Implementation Steps:**
1. Sign up for Storyblok (free tier)
2. Install: `npm install @storyblok/astro`
3. Create "Logo" component in Storyblok
4. Fetch logos in Astro component
5. Update automatically when changed in Storyblok

---

## My Recommendation

### Immediate Fix (Today):
**Use SVG logos** - Convert your PNG to SVG and use CSS color switching

### Short-Term (This Week):
**Set up Supabase Storage** - Upload logo files and reference URLs

### Long-Term (Next Month):
**Consider Storyblok** - If you need visual editing for non-technical users

---

## Quick SVG Logo Fix

If you have an SVG version of your logo, here's the code:

```astro
<!-- Logo.astro -->
---
const logoSvg = companyData.globalCompanyLogo || "";
const isSvg = logoSvg.includes("<svg");
---

{isSvg && (
  <div class="logo-wrapper" set:html={logoSvg} />
)}

<style>
  .logo-wrapper :global(svg) {
    fill: currentColor;
    color: #000000;
    transition: color 0.2s ease;
  }
  .dark .logo-wrapper :global(svg) {
    color: #ffffff;
  }
</style>
```

This will make SVG logos automatically change color based on theme!

