# Feature Modules - Directory-Based Approach

## Philosophy

**Features = Directories/Modules**, not scattered components. Like `pdf-system/`, each feature should be self-contained.

## 📦 Your Feature Modules

Based on your codebase structure:

### Component-Based Features

```
src/components/
├── pdf-system/              # Feature: PDF System ✅
│   ├── PDFSystem.astro      
│   ├── pdf-system.config.ts
│   ├── templates/
│   └── README.md
│
├── vapi/                    # Feature: VAPI Voice ✅
│   └── VapiChatWidget.astro
│
├── admin/                   # Feature: Admin Tools ✅
│   ├── ContractEditor.astro
│   └── FinanceDashboard.astro
│
├── project/                 # Feature: Project Management ✅
│   └── [28 project components]
│
├── widgets/                 # Feature: Map Widgets ✅
│   └── Mapbox3d.astro
```

### Page-Based Features

```
src/pages/
├── ai-agent/                # Feature: AI Agent ✅
│   ├── index.astro
│   ├── knowledge.astro
│   └── memory-system.astro
│
├── admin/                   # Feature: Admin Pages ✅
│   ├── pdf-system.astro
│   ├── finance.astro
│   ├── analytics.astro
│   └── users.astro
│
├── voice-assistant-vapi.astro  # Feature: Voice Assistant ✅
├── voice-assistant.astro       # Feature: Voice Assistant (Alt) ✅
```

### Single-File Features

```
src/components/common/
├── AIChatAgent.astro        # Feature: AI Chat ✅
├── CampfireChatWidget.astro # Feature: Campfire Chat ✅
├── HttpChatWidget.astro     # Feature: HTTP Chat ✅
├── CalComBooking.astro      # Feature: Calendar Booking ✅
├── MapboxWidget.astro       # Feature: Mapbox ✅
├── Testimonials.astro       # Feature: Testimonials ✅
├── PricingCard.astro        # Feature: Pricing ✅
└── Newsletter.astro         # Feature: Newsletter (if exists)
```

## 🎯 Mapping Features to Flags

### site-config.json

```json
{
  "features": {
    // Module features
    "pdfSystem": true,
    "voiceAssistant": true,
    "aiAgent": true,
    "adminTools": true,
    
    // Widget features
    "chat": true,
    "mapWidget": true,
    "calendarBooking": true,
    
    // Marketing features
    "testimonials": true,
    "pricing": false,
    "blog": false,
    "newsletter": false,
    
    // Analytics features
    "analytics": true,
    "activityFeed": true
  }
}
```

## 🔌 Feature Module Pattern

### Example: PDF System Module

```
pdf-system/
├── PDFSystem.astro       # Main entry point
├── config.ts             # Module configuration
├── README.md             # Module documentation
└── templates/            # Module assets
```

**Usage:**
```astro
---
import { isFeatureEnabled } from '@/lib/features';
import PDFSystem from '@/components/pdf-system/PDFSystem.astro';

const showPDFSystem = isFeatureEnabled('pdfSystem');
---

{showPDFSystem && <PDFSystem />}
```

### Example: Voice Assistant Module

```
pages/voice-assistant-vapi.astro  # Single file module

---
import { isFeatureEnabled } from '../lib/features';

// Entire page is the feature - redirect if disabled
if (!isFeatureEnabled('voiceAssistant')) {
  return Astro.redirect('/');
}
---
```

### Example: AI Agent Module

```
pages/ai-agent/
├── index.astro           # Main page
├── knowledge.astro       # Sub-feature
└── memory-system.astro   # Sub-feature

---
// In each file
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('aiAgent')) {
  return Astro.redirect('/');
}
---
```

## 📋 Implementation Strategy

### Phase 1: Route-Level Guards (High Priority)

Protect entire feature pages/routes:

```astro
---
// pages/admin/pdf-system.astro
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('pdfSystem')) {
  return Astro.redirect('/admin');
}
---
```

**Pages to guard:**
- [ ] `/voice-assistant-vapi` → `voiceAssistant`
- [ ] `/ai-agent/*` → `aiAgent`
- [ ] `/admin/pdf-system` → `pdfSystem`
- [ ] `/admin/finance` → `adminTools.finance`
- [ ] `/admin/analytics` → `analytics`

### Phase 2: Component-Level Guards

For components used in multiple places:

```astro
---
// components/common/MapboxWidget.astro
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('mapWidget')) {
  return null;
}
---

<div class="mapbox-widget">
  <!-- Widget content -->
</div>
```

**Components to guard:**
- [x] `ChatWidget` (done in Aside)
- [ ] `MapboxWidget`
- [ ] `CalComBooking`
- [ ] `Testimonials`
- [ ] `PricingCard`

### Phase 3: Navigation Guards

Remove links to disabled features:

```astro
---
import { isFeatureEnabled } from '@/lib/features';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
];

if (isFeatureEnabled('voiceAssistant')) {
  navItems.push({ label: 'Voice Assistant', href: '/voice-assistant' });
}

if (isFeatureEnabled('aiAgent')) {
  navItems.push({ label: 'AI Agent', href: '/ai-agent' });
}
---
```

## 🎨 Real-World Configuration Examples

### Client A: Full Suite
```json
{
  "features": {
    "pdfSystem": true,
    "voiceAssistant": true,
    "aiAgent": true,
    "chat": true,
    "mapWidget": true,
    "calendarBooking": true,
    "testimonials": true,
    "analytics": true
  }
}
```

### Client B: Minimal (Projects Only)
```json
{
  "features": {
    "pdfSystem": false,
    "voiceAssistant": false,
    "aiAgent": false,
    "chat": false,
    "mapWidget": false,
    "calendarBooking": false,
    "testimonials": false,
    "analytics": true
  }
}
```

### Client C: Voice-Focused
```json
{
  "features": {
    "pdfSystem": false,
    "voiceAssistant": true,
    "aiAgent": true,
    "chat": true,
    "mapWidget": false,
    "calendarBooking": true,
    "testimonials": false,
    "analytics": false
  }
}
```

## 🛡️ Helper: Feature Module Guard

Create a reusable guard for entire modules:

```typescript
// src/lib/feature-guard.ts
import { isFeatureEnabled } from './features';

export function featureModuleGuard(
  featureKey: string, 
  redirectTo: string = '/'
): boolean {
  if (!isFeatureEnabled(featureKey)) {
    return false; // Caller should redirect
  }
  return true;
}

// Usage in pages:
if (!featureModuleGuard('pdfSystem', '/admin')) {
  return Astro.redirect('/admin');
}
```

## 📊 Feature Dependency Tree

Some features depend on others:

```
voiceAssistant
├── Requires: VAPI API keys
└── Optional: aiAgent (for smart responses)

aiAgent
├── Requires: Anthropic API key
└── Uses: Supabase for knowledge

pdfSystem
├── Requires: pdf-lib dependency
└── Uses: Supabase for storage

chat
├── Choice: HttpChatWidget OR CampfireChatWidget
└── Requires: Respective API keys
```

## 🔍 Finding Feature Modules

```bash
# Find directory-based features
ls -d src/components/*/

# Find page-based features
ls -d src/pages/*/

# Find large single-file features
find src/components/common -name "*.astro" -exec wc -l {} + | sort -rn | head -20
```

## ✅ Recommended Implementation Order

### Week 1: Route Guards
1. Voice assistant pages
2. AI agent pages  
3. Admin feature pages
4. Chat widgets ✅ (done)

### Week 2: Widget Guards
1. MapboxWidget
2. CalComBooking
3. Testimonials
4. Pricing components

### Week 3: Navigation
1. Update main navigation
2. Update admin navigation
3. Update Speed Dial
4. Update Footer

### Week 4: Testing
1. Test each feature enabled/disabled
2. Verify no broken links
3. Check error handling
4. Document configuration

## 💡 Pro Tips

1. **Think in modules** - Group related components
2. **Guard at the highest level** - Route > Component > Widget
3. **Graceful degradation** - Page works without optional features
4. **Document dependencies** - Note what each feature needs
5. **Test isolation** - Each feature should work independently

## 🎯 Summary

**Your features ARE modules:**
- `pdf-system/` directory = module ✅
- `ai-agent/` directory = module ✅
- `voice-assistant-vapi.astro` = module ✅
- `ChatWidget.astro` = module ✅

**Just guard the entry points** (pages/components) and the whole feature is controlled!

Much cleaner than component-by-component checking. 🚀

