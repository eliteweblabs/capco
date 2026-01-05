# Markdown Template System

Define which page template/layout to use by setting `template` in your markdown frontmatter.

## Available Templates

### 1. **`default`** - Standard Content Page
```markdown
---
title: "About Us"
template: "default"
---

# About Our Company

Standard content page with max-width container, prose styling, and App layout.
```

**Features:**
- ✅ Max-width container (4xl)
- ✅ Prose typography styling
- ✅ Full App layout (header, footer, sidebar)
- ✅ Padding and spacing
- ✅ Auth support

**Best for:** Blog posts, documentation, about pages, standard content

---

### 2. **`fullwidth`** - Full-Width Landing Page
```markdown
---
title: "Home"
template: "fullwidth"
---

<NodesCapco />
<LandingProductCapco />
```

**Features:**
- ✅ Full-width container (no max-width)
- ✅ No prose styling (components control their own styles)
- ✅ Full App layout (header, footer, sidebar)
- ✅ No padding (components add their own)
- ✅ Auth support

**Best for:** Landing pages, home pages, marketing pages with custom components

---

### 3. **`minimal`** - Minimal Chrome
```markdown
---
title: "Privacy Policy"
template: "minimal"
---

# Privacy Policy

Clean page with no navigation or branding.
```

**Features:**
- ✅ Max-width container (4xl)
- ✅ Prose typography styling
- ❌ NO App layout (no header, footer, sidebar)
- ✅ Basic styling only
- ❌ No auth

**Best for:** Legal pages, privacy policy, terms of service, print-friendly pages

---

## Template Comparison

| Feature | `default` | `fullwidth` | `minimal` |
|---------|-----------|-------------|-----------|
| Container | Max-width | Full-width | Max-width |
| Prose Styling | ✅ Yes | ❌ No | ✅ Yes |
| Header/Nav | ✅ Yes | ✅ Yes | ❌ No |
| Footer | ✅ Yes | ✅ Yes | ❌ No |
| Sidebar | ✅ Yes | ✅ Yes | ❌ No |
| Auth Support | ✅ Yes | ✅ Yes | ❌ No |
| Padding | ✅ Yes | ❌ No | ✅ Yes |

## Usage Examples

### Standard Blog Post
```markdown
---
title: "How to Use Fire Extinguishers"
description: "A guide to fire safety"
template: "default"
---

# Fire Safety Guide

Regular content with navigation and branding.
```

### Landing Page
```markdown
---
title: "Welcome"
template: "fullwidth"
---

<NodesCapco />
<LandingProductCapco />
<Testimonials />
<ContactForm />
```

### Legal Page
```markdown
---
title: "Privacy Policy"
template: "minimal"
---

# Privacy Policy

Clean, distraction-free content.
```

## How It Works

**1. Define Template in Frontmatter:**
```markdown
---
template: "fullwidth"
---
```

**2. Router Selects Template:**
`src/pages/[...slug].astro` reads the `template` field and loads the appropriate component.

**3. Template Renders Content:**
The template component handles layout, styling, and component injection.

## Adding Custom Templates

**1. Create Template Component:**
```astro
// src/components/common/MarkdownPageCustom.astro
---
import App from "./App.astro";
import { getPageContent } from "../../lib/content";
// ... your custom layout logic
---

<App>
  <!-- Your custom template structure -->
</App>
```

**2. Register in Router:**
```astro
// src/pages/[...slug].astro
const templates = {
  default: MarkdownPage,
  fullwidth: MarkdownPageFullWidth,
  minimal: MarkdownPageMinimal,
  custom: MarkdownPageCustom, // Add here
};
```

**3. Use in Markdown:**
```markdown
---
template: "custom"
---
```

## Default Behavior

If no `template` is specified, `default` is used:

```markdown
---
title: "My Page"
# No template specified → uses "default"
---
```

---

**Current Templates:**
- ✅ `default` - Standard content page
- ✅ `fullwidth` - Full-width landing page
- ✅ `minimal` - No chrome/branding

