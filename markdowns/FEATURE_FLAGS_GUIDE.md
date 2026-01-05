# Feature Flags System

## Overview

Control which components/features are enabled per client using the `features` section in `site-config.json`.

## How It Works

### 1. Define Features in site-config.json

```json
{
  "features": {
    "voiceAssistant": true,
    "blog": false,
    "pricing": false,
    "testimonials": true,
    "chat": true,
    "newsletter": false,
    "analytics": true,
    "mapWidget": false
  }
}
```

### 2. Check Features in Components

```astro
---
import { isFeatureEnabled } from '@/lib/content';
import VoiceAssistant from './VoiceAssistant.astro';

const showVoiceAssistant = isFeatureEnabled('voiceAssistant');
---

{showVoiceAssistant && <VoiceAssistant />}
```

## Common Patterns

### Pattern 1: Simple Component Toggle

```astro
---
import { isFeatureEnabled } from '@/lib/content';
import ChatWidget from './ChatWidget.astro';

const showChat = isFeatureEnabled('chat');
---

<div>
  <h1>Welcome</h1>
  
  {showChat && <ChatWidget />}
</div>
```

### Pattern 2: Navigation Items

```astro
---
import { getSiteConfig } from '@/lib/content';

const config = getSiteConfig();
const showBlog = config.features.blog;
const showPricing = config.features.pricing;
---

<nav>
  <a href="/">Home</a>
  <a href="/projects">Projects</a>
  {showBlog && <a href="/blog">Blog</a>}
  {showPricing && <a href="/pricing">Pricing</a>}
  <a href="/contact">Contact</a>
</nav>
```

### Pattern 3: Multiple Features Check

```astro
---
import { getSiteConfig } from '@/lib/content';

const config = getSiteConfig();
const hasMarketingFeatures = 
  config.features.blog || 
  config.features.testimonials || 
  config.features.newsletter;
---

{hasMarketingFeatures && (
  <section class="marketing">
    {config.features.blog && <BlogPreview />}
    {config.features.testimonials && <Testimonials />}
    {config.features.newsletter && <Newsletter />}
  </section>
)}
```

### Pattern 4: Component-Level Check

```astro
---
// VoiceAssistantButton.astro
import { isFeatureEnabled } from '@/lib/content';

// Return early if feature disabled
if (!isFeatureEnabled('voiceAssistant')) {
  return null;
}
---

<button>Start Voice Assistant</button>
```

## Real Examples

### Example 1: Homepage with Optional Sections

```astro
---
// src/pages/index.astro
import { getSiteConfig } from '@/lib/content';
import Hero from '@/components/Hero.astro';
import Features from '@/components/Features.astro';
import Testimonials from '@/components/Testimonials.astro';
import Pricing from '@/components/Pricing.astro';
import Blog from '@/components/Blog.astro';
import Newsletter from '@/components/Newsletter.astro';

const config = getSiteConfig();
---

<App>
  <Hero />
  <Features />
  
  {config.features.testimonials && <Testimonials />}
  {config.features.pricing && <Pricing />}
  {config.features.blog && <Blog />}
  {config.features.newsletter && <Newsletter />}
</App>
```

### Example 2: Conditional Speed Dial Actions

```astro
---
// SpeedDial.astro
import { getSiteConfig } from '@/lib/content';

const config = getSiteConfig();
const actions = [];

if (config.features.voiceAssistant) {
  actions.push({ icon: 'microphone', href: '/voice-assistant' });
}
if (config.features.chat) {
  actions.push({ icon: 'message', href: '/chat' });
}
if (config.features.newsletter) {
  actions.push({ icon: 'envelope', href: '/newsletter' });
}
---

<div class="speed-dial">
  {actions.map(action => (
    <a href={action.href}>
      <i class={`bx bx-${action.icon}`}></i>
    </a>
  ))}
</div>
```

### Example 3: Dashboard Widgets

```astro
---
// src/pages/dashboard.astro
import { isFeatureEnabled } from '@/lib/content';

const widgets = {
  analytics: isFeatureEnabled('analytics'),
  mapWidget: isFeatureEnabled('mapWidget'),
  voiceAssistant: isFeatureEnabled('voiceAssistant'),
};
---

<div class="dashboard-grid">
  <div class="widget">Projects</div>
  <div class="widget">Files</div>
  
  {widgets.analytics && (
    <div class="widget">
      <Analytics />
    </div>
  )}
  
  {widgets.mapWidget && (
    <div class="widget">
      <MapboxWidget />
    </div>
  )}
  
  {widgets.voiceAssistant && (
    <div class="widget">
      <VoiceAssistantWidget />
    </div>
  )}
</div>
```

## Component Updates Needed

Here are components that should check feature flags:

### High Priority

1. **Voice Assistant** (`voice-assistant-vapi.astro`)
   ```astro
   if (!isFeatureEnabled('voiceAssistant')) {
     return Astro.redirect('/');
   }
   ```

2. **Chat Widget** (`CampfireChatWidget.astro`, `HttpChatWidget.astro`)
   ```astro
   const showChat = isFeatureEnabled('chat');
   if (!showChat) return null;
   ```

3. **MapboxWidget** (`MapboxWidget.astro`)
   ```astro
   const showMap = isFeatureEnabled('mapWidget');
   if (!showMap) return null;
   ```

### Medium Priority

4. **Testimonials** (if exists)
5. **Blog** (if exists)
6. **Pricing** (if exists)
7. **Newsletter** (if exists)

### Low Priority

8. **Analytics widgets**
9. **Optional dashboard sections**

## Helper Utilities

### Create Feature Gate Helper

```typescript
// src/lib/features.ts
import { isFeatureEnabled, getSiteConfig } from './content';

/**
 * Feature gate - returns component or null
 */
export function featureGate(featureKey: string, component: any) {
  return isFeatureEnabled(featureKey) ? component : null;
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  const config = getSiteConfig();
  return Object.entries(config.features)
    .filter(([key, value]) => value === true)
    .map(([key]) => key);
}

/**
 * Check if any of the features are enabled
 */
export function anyFeatureEnabled(...features: string[]): boolean {
  return features.some(f => isFeatureEnabled(f));
}

/**
 * Check if all features are enabled
 */
export function allFeaturesEnabled(...features: string[]): boolean {
  return features.every(f => isFeatureEnabled(f));
}
```

### Usage with Helpers

```astro
---
import { anyFeatureEnabled } from '@/lib/features';

const showMarketingSection = anyFeatureEnabled('blog', 'testimonials', 'newsletter');
---

{showMarketingSection && (
  <section>Marketing Content</section>
)}
```

## Testing Feature Flags

### Test Different Configurations

```json
// site-config.json - Client A (Full features)
{
  "features": {
    "voiceAssistant": true,
    "chat": true,
    "blog": true,
    "pricing": true
  }
}
```

```json
// site-config.json - Client B (Minimal)
{
  "features": {
    "voiceAssistant": false,
    "chat": false,
    "blog": false,
    "pricing": false
  }
}
```

### Test Locally

```bash
# Test with full features
cp site-config-full.json site-config.json
npm run dev

# Test with minimal features
cp site-config-minimal.json site-config.json
npm run dev
```

## Best Practices

1. **Default to false** - Safer for new features
2. **Document features** - Comment what each does
3. **Group related features** - Keep organized
4. **Test both states** - Always test enabled AND disabled
5. **Graceful degradation** - Page should work without optional features

## Per-Client Configuration

### Client A (Acme Fire) - Full Suite
```json
{
  "features": {
    "voiceAssistant": true,
    "chat": true,
    "testimonials": true,
    "analytics": true,
    "mapWidget": true
  }
}
```

### Client B (Smith Safety) - Basic
```json
{
  "features": {
    "voiceAssistant": false,
    "chat": false,
    "testimonials": false,
    "analytics": true,
    "mapWidget": false
  }
}
```

## Next Steps

1. **Update key components** to check feature flags
2. **Test with features disabled** to ensure graceful degradation
3. **Document each feature** in site-config.json.example
4. **Create feature testing guide** for QA

## Summary

**Feature flags let you:**
- ✅ Enable/disable features per client
- ✅ Keep single codebase
- ✅ No code changes to toggle features
- ✅ Test different configurations locally
- ✅ Gradually roll out new features

**Just edit `site-config.json` to control what's active!** 🎯

