# Markdown Component System

Build pages in Markdown with embedded Astro components! This system allows you to use component "shortcodes" like `<GoogleMap/>` directly in your markdown content.

## 🎯 How It Works

1. **Write Markdown**: Create content in `content/pages/your-page.md`
2. **Embed Components**: Use `<ComponentName prop="value"/>` syntax
3. **Render Automatically**: Components are parsed, rendered, and injected into the page

## 📝 Basic Usage

### Create a Markdown Page

```markdown
---
title: "My Page"
description: "Page with embedded components"
---

# Welcome

Here's a Google Map:

<GoogleMap lat="37.7749" lng="-122.4194" zoom="12"/>

Contact us below:

<ContactForm/>
```

### Access the Page

Navigate to `/your-page` (the slug matches the filename without `.md`)

## 🧩 Available Components

### Features
- `<GoogleMap lat="..." lng="..." zoom="..."/>` - Google Maps widget
- `<Testimonials count="3"/>` - Customer testimonials
- `<CalComBooking/>` - Cal.com booking widget
- `<VapiChatWidget/>` - VAPI AI voice chat
- `<FeedbackWidget/>` - User feedback form

### Shared Components
- `<ContactForm/>` - Contact form
- `<ContactFormWithUpload/>` - Contact form with file upload
- `<PricingCard title="..." price="..." features="..."/>` - Pricing card
- `<PDFPreview url="..."/>` - PDF preview
- `<SpeedDial/>` - Speed dial action button

### Layout
- `<LandingProduct/>` - Product landing section

## ⚠️ Nested Shortcodes

**Shortcodes cannot be nested inside other shortcodes.** The parser only extracts top-level component tags. If you pass something like `leftContent="<ImageBlock/>"` to TwoColumnBlock, it will be output as raw text/HTML—the inner component is never parsed or rendered.

**Workaround**: Use direct Astro files instead of markdown when you need nesting—e.g. create a page that imports both TwoColumnBlock and ImageBlock and composes them with slots. For CMS/markdown, stick to HTML strings in content props (e.g. `leftContent="<img src='...' />"`).

## 🔧 Component Syntax

### Self-Closing Tags
```html
<ComponentName/>
<ComponentName prop="value"/>
<ComponentName prop1="value1" prop2="value2"/>
```

### With Props
```html
<GoogleMap lat="37.7749" lng="-122.4194" zoom="12"/>
<PricingCard title="Pro" price="99" features="All features,Priority support"/>
```

**Note**: Use `prop="value"` format. Props are passed as strings.

## ➕ Adding New Components

### 1. Register the Component

Edit `src/lib/component-registry.ts`:

```typescript
export const componentRegistry: Record<string, ComponentRegistryEntry> = {
  // ... existing components
  MyNewComponent: {
    path: "../features/my-new-component/MyNewComponent.astro",
    category: "feature",
    description: "My awesome component",
  },
};
```

### 2. Import in MarkdownPage

Edit `src/components/common/MarkdownPage.astro`:

```typescript
// Add to imports
import MyNewComponent from "../../features/my-new-component/MyNewComponent.astro";

// Add to componentMap
const componentMap: Record<string, any> = {
  // ... existing
  MyNewComponent,
};
```

### 3. Use in Markdown

```html
<MyNewComponent prop="value"/>
```

## 🎨 Examples

### Location Page with Map

```markdown
---
title: "Our Location"
---

# Visit Us

We're located in San Francisco:

<GoogleMap lat="37.7749" lng="-122.4194" zoom="15"/>

## Get in Touch

<ContactForm/>
```

### Services Page with Pricing

```markdown
---
title: "Services & Pricing"
---

# Our Services

## Basic Plan
<PricingCard title="Basic" price="29" features="5 projects,Email support,Basic features"/>

## Pro Plan
<PricingCard title="Pro" price="99" features="Unlimited projects,Priority support,Advanced features"/>
```

### Testimonials Page

```markdown
---
title: "What Our Clients Say"
---

# Client Testimonials

<Testimonials count="5"/>

## Schedule a Consultation

<CalComBooking/>
```

## 🏗️ Architecture

### Files

- **`src/lib/component-registry.ts`** - Maps component names to file paths
- **`src/lib/markdown-components.ts`** - Parses component shortcodes from markdown
- **`src/components/common/MarkdownPage.astro`** - Renders markdown with components
- **`src/pages/[...slug].astro`** - Dynamic route for all markdown pages

### Process Flow

1. **Parse**: Extract `<ComponentName/>` tags from markdown
2. **Replace**: Replace tags with placeholder `<div>` elements
3. **Render Markdown**: Convert markdown to HTML with placeholders
4. **Render Components**: Server-side render actual Astro components
5. **Inject**: Client-side JS moves rendered components into placeholders

## 🚀 Benefits

- ✅ **No Code Required** - Content editors can embed components
- ✅ **Type Safe** - Component registry ensures valid components
- ✅ **SSR Support** - Components render server-side for SEO
- ✅ **Extensible** - Easy to add new components
- ✅ **Markdown Native** - Seamlessly integrates with markdown content

## 🔍 Debugging

Enable component logging by checking browser console:

```javascript
// Console will show:
// - Placeholders found
// - Components being moved
// - Component rendering errors
```

## 📚 Demo Page

Visit `/component-demo` to see all available components in action.

## 🛡️ Security

- Components are pre-registered (whitelist approach)
- Only components in the registry can be rendered
- Props are sanitized during parsing
- No arbitrary code execution from markdown

---

**Questions?** Check the component registry at `src/lib/component-registry.ts` for all available components.

