# Converting Pages to Use Content System

## Strategy

**IMPORTANT:** We keep `.astro` files as templates/structure, and create `.md` files for content.

```
✅ KEEP: src/pages/contact.astro (template)
✅ CREATE: content/pages/contact.md (content)
```

## Pages to Convert

### High Priority (Public-Facing)
1. ✅ **contact.astro** - DONE
2. **index.astro** - Home page (mostly components, but title/description)
3. **about.astro** - If exists
4. **services.astro** - If exists
5. **pricing.astro** - If exists

### Low Priority (Internal/Technical)
- **voice-assistant-vapi.astro** - Instructions could be markdown
- **ai-agent/index.astro** - Mostly functional
- **404.astro** - Could be markdown

### DON'T Convert
- Dashboard pages (dynamic data)
- API endpoints
- Auth pages (functional)
- Project management pages (dynamic)

## Current Status

### ✅ Converted
- **contact.astro** → Uses `content/pages/contact.md`

### 🔄 Need Conversion
- **index.astro** → Needs `content/pages/home.md`
  - Currently uses Nodes and LandingProduct components
  - Title/description from globalCompanyData
  - **ACTION:** Can add hero section from markdown

### Already Good
- Most pages use `globalCompanyData()` for company info
- This is fine! It pulls from env vars/site-config

## What Needs Converting

### Hardcoded Text That Should Be in Markdown:

1. **Page titles** - Currently in `<App title="...">`
2. **Hero sections** - If any hardcoded titles/subtitles
3. **Instructions/help text** - Like voice assistant instructions
4. **Form URLs** - Currently hardcoded iframe URLs
5. **Marketing copy** - Any hardcoded descriptions

### What Can Stay in .astro Files:

1. **Layout/structure** - Component imports, wrappers
2. **Dynamic data** - Dashboard stats, project lists
3. **Conditional logic** - Show/hide based on user role
4. **Auth checks** - requireAuthRedirect logic
5. **Components** - Nodes, LandingProduct, etc.

## Example: index.astro

### Before (Current):
```astro
<App
  title={globalCompanyName}
  description={globalCompanySlogan}
>
  <Nodes />
  <LandingProduct />
</App>
```

### After (Converted):
```astro
---
import { getPageContent, getSiteConfig } from '../lib/content';
const pageContent = await getPageContent('home');
const siteConfig = getSiteConfig();
---

<App
  title={pageContent.title || siteConfig.site.name}
  description={pageContent.description || siteConfig.site.slogan}
>
  {pageContent.showHero && (
    <Hero 
      title={pageContent.hero.title}
      subtitle={pageContent.hero.subtitle}
    />
  )}
  
  <Nodes />
  <LandingProduct />
  
  {pageContent.content && (
    <div class="prose" set:html={pageContent.content} />
  )}
</App>
```

### content/pages/home.md:
```markdown
---
title: "Fire Protection Services"
description: "Professional fire protection plan review"
showHero: true
hero:
  title: "Welcome to Professional Fire Protection"
  subtitle: "Expert plan review and approval services"
---

# Additional Content

Any additional marketing copy here...
```

## Migration Checklist

### Phase 1: Core Pages (Now)
- [x] contact.astro → content/pages/contact.md
- [ ] index.astro → content/pages/home.md  
- [ ] Create about.md if about page exists
- [ ] Create services.md if needed

### Phase 2: Feature Pages (Later)
- [ ] voice-assistant-vapi.astro → Instructions from markdown
- [ ] pricing.astro → Pricing tiers from markdown
- [ ] testimonials component → Testimonials from markdown

### Phase 3: Components (Optional)
- [ ] Hero component → Support markdown content
- [ ] Features component → Load from markdown
- [ ] Testimonials component → Load from markdown

## Commands to Run

```bash
# 1. Already have content directory
ls -la content/

# 2. Create home.md
vim content/pages/home.md

# 3. Update index.astro to use it
vim src/pages/index.astro

# 4. Test
npm run dev
```

## Decision: What Content System Should Handle

### ✅ Use Content System For:
- Page titles and meta descriptions
- Hero sections (title, subtitle, CTA)
- Static marketing copy
- Instructions and help text
- Form URLs and settings
- Testimonials
- Features lists
- Service descriptions

### ❌ Don't Use Content System For:
- Dynamic dashboards
- User-generated content (projects, files)
- Auth flows
- API responses
- Real-time data
- Interactive components logic

## The index.astro Special Case

The homepage is **mostly components** (Nodes, LandingProduct), which are functional/interactive.

### Options:

**Option A: Minimal Conversion** (Recommended for now)
- Keep using `globalCompanyData()` for title/description
- Add optional hero from markdown
- Let components handle their own content

**Option B: Full Conversion**
- Move ALL content to markdown
- Configure which components to show
- More flexible but more complex

**Option C: Hybrid** (Best Long-term)
- Company info from `site-config.json`
- Optional hero from `content/pages/home.md`
- Components stay as-is but configurable

## Recommendation

### For Your Current Needs:

**Keep it simple:**

1. **contact.astro** ✅ - Already using content system (DONE)
2. **index.astro** - Keep as-is (mostly components, uses globalCompanyData)
3. **Other pages** - Convert ONLY if they have hardcoded text

### Why?

- Your homepage is mostly `<Nodes />` and `<LandingProduct />` components
- Those components are functional/visual, not content-heavy
- `globalCompanyData()` already pulls from env vars (good enough!)
- Only convert pages with actual hardcoded content

### When to Convert More:

Convert additional pages when:
1. You find hardcoded text that differs per client
2. You add new marketing pages with content
3. Clients want to customize specific page sections

## Next Steps

1. **Test what we have:**
   ```bash
   npm run dev
   # Visit /contact - should work with markdown
   ```

2. **Review other pages:**
   ```bash
   grep -r "title=" src/pages/*.astro | head -20
   ```

3. **Convert only pages with hardcoded content**

4. **Document which pages use content system:**
   - Keep a list in `content/README.md`

## Summary

**We DON'T need to convert everything!**

The system is now ready:
- ✅ Content system works (`src/lib/content.ts`)
- ✅ Contact page uses it
- ✅ Gitignore configured
- ✅ Scripts ready

**Convert pages only when they have hardcoded client-specific content.**

Most of your pages use `globalCompanyData()` which is **already environment-based** - that's good enough for now!

