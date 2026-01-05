# Architecture Decision: Content Organization

## The Confusion

Initially we had TWO places for page content:
1. `content/pages/*.md` - Markdown files with frontmatter
2. `site-config.json` → `pages` section - JSON configuration

This was redundant and confusing!

## The Fix

**Clear separation of concerns:**

### ✅ site-config.json = GLOBAL Settings
```json
{
  "site": {
    "name": "Company Name",
    "slogan": "Company Slogan",
    "phone": "+15551234567",
    "email": "contact@example.com"
  },
  "branding": {
    "primaryColor": "#825BDD",
    "secondaryColor": "#0ea5e9",
    "logoSvg": "<svg>...</svg>"
  },
  "navigation": {
    "main": [...],
    "footer": [...]
  },
  "features": {
    "voiceAssistant": true,
    "blog": false,
    "pricing": false
  }
}
```

**Use for:** Company-wide settings that apply everywhere

### ✅ content/pages/*.md = PAGE Content
```markdown
---
title: "Contact Us"
description: "Get in touch"
hero:
  title: "Contact Us"
  subtitle: "We're here to help"
formUrl: "https://forms.example.com"
showForm: true
---

# Contact Us

Your markdown content here...
```

**Use for:** Page-specific content and settings

## The Rule

**If it's specific to ONE page → Markdown frontmatter**
- Page title
- Hero section
- Form URLs
- Page-specific toggles
- Page content

**If it's used across ALL pages → site-config.json**
- Company name
- Brand colors
- Logo
- Navigation structure
- Global feature flags

## Example: Contact Form URL

### ❌ Wrong (Duplicate):
```json
// site-config.json
{
  "pages": {
    "contact": {
      "formUrl": "https://..."
    }
  }
}
```

```markdown
<!-- content/pages/contact.md -->
---
formUrl: "https://..."
---
```

### ✅ Right (Single source):
```markdown
<!-- content/pages/contact.md -->
---
title: "Contact Us"
formUrl: "https://forms.example.com"
showForm: true
---

# Get In Touch
...
```

## Benefits

1. **No duplication** - Each setting has ONE home
2. **Easier to find** - Page settings with page content
3. **Cleaner config** - site-config.json stays focused
4. **Better for clients** - Edit markdown = see content immediately
5. **Scalable** - Add pages without touching site-config.json

## Migration

If you have page-specific settings in `site-config.json`:

1. **Move to markdown frontmatter:**
   ```bash
   # From site-config.json pages section
   # To content/pages/pagename.md frontmatter
   ```

2. **Remove from site-config.json:**
   ```json
   // Delete the "pages" section entirely
   ```

3. **Update content.ts:**
   - Remove fallback to `config.pages[slug]`
   - Only read from markdown files

## Summary

**site-config.json** = Global site settings (colors, logo, nav, features)
**content/pages/*.md** = Per-page content and settings (title, hero, forms, content)

Clean. Simple. Scalable. ✅

