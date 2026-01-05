# Feature Management - Multi-Layer System

## 🎯 The Problem

Features need to be controlled at multiple levels:
1. **Development** - Turn features on/off locally
2. **Deployment Template** - Let Railway users choose features during setup
3. **Runtime** - Load/hide features based on config
4. **Pages** - Feature-specific routes that shouldn't exist if feature is off

## 📊 The Three Layers

```
┌─────────────────────────────────────────┐
│   Layer 1: Railway Template            │
│   (Initial Setup - One Time)           │
│   - User selects features during deploy│
│   - Sets environment variables         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 2: site-config.json             │
│   (Per-Deployment Config)               │
│   - Generated from env vars on build    │
│   - Gitignored, client-specific         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Layer 3: Runtime Guards               │
│   (Code Checks)                         │
│   - Pages check feature flags           │
│   - Components conditionally render     │
│   - Navigation hides disabled features  │
└─────────────────────────────────────────┘
```

## 🔧 Layer 1: Railway Template

### railway-template.json

```json
{
  "name": "Fire Protection System",
  "variables": {
    "RAILWAY_PROJECT_NAME": {
      "description": "Company Name"
    },
    "GLOBAL_COLOR_PRIMARY": {
      "description": "Primary Brand Color",
      "default": "#825BDD"
    },
    
    // ✨ FEATURE FLAGS
    "FEATURE_PDF_SYSTEM": {
      "description": "Enable PDF Template System?",
      "default": "true"
    },
    "FEATURE_VOICE_ASSISTANT": {
      "description": "Enable Voice Assistant (requires VAPI)?",
      "default": "false"
    },
    "FEATURE_AI_AGENT": {
      "description": "Enable AI Agent (requires Anthropic)?",
      "default": "false"
    },
    "FEATURE_CHAT": {
      "description": "Enable Chat Widgets?",
      "default": "true"
    },
    "FEATURE_MAPS": {
      "description": "Enable Map Widgets?",
      "default": "false"
    },
    
    // Conditional vars (only shown if feature enabled)
    "VAPI_API_KEY": {
      "description": "VAPI API Key (required for voice assistant)",
      "default": ""
    },
    "ANTHROPIC_API_KEY": {
      "description": "Anthropic API Key (required for AI agent)",
      "default": ""
    }
  }
}
```

**User Experience:**
1. User clicks "Deploy to Railway"
2. Sees checkboxes for each feature
3. Conditional fields appear (e.g., VAPI_API_KEY only if voice assistant enabled)
4. Railway sets environment variables

## ⚙️ Layer 2: Build-Time Config Generation

### scripts/generate-site-config.js

Create a script that runs during build to generate `site-config.json` from env vars:

```javascript
// scripts/generate-site-config.js
import fs from 'fs';
import path from 'path';

// Read environment variables
const features = {
  'pdf-system': process.env.FEATURE_PDF_SYSTEM === 'true',
  'voice-assistant': process.env.FEATURE_VOICE_ASSISTANT === 'true',
  'ai-agent': process.env.FEATURE_AI_AGENT === 'true',
  'chat': process.env.FEATURE_CHAT === 'true',
  'maps': process.env.FEATURE_MAPS === 'true',
  'calendar': process.env.FEATURE_CALENDAR === 'true',
  'testimonials': process.env.FEATURE_TESTIMONIALS === 'true',
};

// Load existing site-config or create new
let siteConfig = {};
const configPath = path.join(process.cwd(), 'site-config.json');

if (fs.existsSync(configPath)) {
  siteConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

// Update features section
siteConfig.features = features;

// Write back
fs.writeFileSync(configPath, JSON.stringify(siteConfig, null, 2));

console.log('✅ Generated site-config.json with features:', features);
```

### package.json

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-site-config.js",
    "build": "astro build",
    "dev": "astro dev"
  }
}
```

**Now features are controlled by environment variables!**

## 🚀 Layer 3: Runtime Guards

### A. Page-Level Guards

Each feature has its own pages in `src/pages/`:

```
src/pages/
├── voice-assistant.astro      # Voice feature page
├── ai-agent/
│   ├── index.astro            # AI agent pages
│   └── knowledge.astro
└── admin/
    └── pdf-system.astro       # PDF feature page
```

**Guard each page:**

```astro
---
// src/pages/voice-assistant.astro
import { isFeatureEnabled } from '@/lib/features';

// 🛡️ GUARD: Redirect if feature disabled
if (!isFeatureEnabled('voice-assistant')) {
  return Astro.redirect('/');
}

import VoiceAssistant from '@/features/vapi/VoiceAssistant.astro';
---

<VoiceAssistant />
```

### B. Component-Level Guards

Components check before rendering:

```astro
---
// src/features/chat/HttpChatWidget.astro
import { isFeatureEnabled } from '@/lib/features';

// Don't render if feature disabled
if (!isFeatureEnabled('chat')) {
  return null;
}
---

<div class="chat-widget">
  <!-- Chat UI -->
</div>
```

### C. Navigation Guards

Remove links to disabled features:

```typescript
// src/pages/api/utils/navigation.ts
import { isFeatureEnabled } from '@/lib/features';

export function getNavigation() {
  const nav = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
  ];

  // ✅ Only add if feature enabled
  if (isFeatureEnabled('voice-assistant')) {
    nav.push({ 
      label: 'Voice Assistant', 
      href: '/voice-assistant',
      icon: 'microphone' 
    });
  }

  if (isFeatureEnabled('ai-agent')) {
    nav.push({ 
      label: 'AI Agent', 
      href: '/ai-agent',
      icon: 'bot' 
    });
  }

  return nav;
}
```

## 📁 Feature Page Systems

### Option 1: Feature-Owned Pages (Recommended)

Keep feature pages inside the feature directory:

```
src/features/pdf-system/
├── components/
│   └── PDFSystem.astro
├── pages/                    # ← Feature pages
│   ├── index.astro
│   ├── templates.astro
│   └── settings.astro
└── README.md
```

Then create **route proxies** in `src/pages/`:

```astro
---
// src/pages/admin/pdf-system.astro (Route Proxy)
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('pdf-system')) {
  return Astro.redirect('/admin');
}

// Import from feature
import PDFSystemPage from '@/features/pdf-system/pages/index.astro';
---

<PDFSystemPage />
```

### Option 2: Dynamic Page Loading

Use Astro's dynamic routing:

```astro
---
// src/pages/features/[feature]/[...page].astro
import { isFeatureEnabled } from '@/lib/features';

const { feature, page } = Astro.params;

// Check if feature enabled
if (!isFeatureEnabled(feature)) {
  return Astro.redirect('/');
}

// Dynamically load feature page
const featurePage = await import(`@/features/${feature}/pages/${page}.astro`);
---

<featurePage.default />
```

**URLs:**
- `/features/pdf-system/templates` → `src/features/pdf-system/pages/templates.astro`
- `/features/ai-agent/knowledge` → `src/features/ai-agent/pages/knowledge.astro`

### Option 3: Simple Direct Pages (Current)

Just check at the top of each page:

```astro
---
// src/pages/voice-assistant.astro
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('voice-assistant')) {
  return Astro.redirect('/');
}
---
```

## 🎨 Example: Complete Feature Setup

### 1. Railway Template Adds Feature

```json
{
  "variables": {
    "FEATURE_TESTIMONIALS": {
      "description": "Show customer testimonials?",
      "default": "true"
    }
  }
}
```

### 2. Build Script Generates Config

```javascript
// Auto-runs on build
const features = {
  'testimonials': process.env.FEATURE_TESTIMONIALS === 'true'
};
```

### 3. Create Feature Module

```
src/features/testimonials/
├── components/
│   ├── Testimonials.astro
│   └── TestimonialCard.astro
├── pages/
│   └── index.astro
└── api/
    └── testimonials.ts
```

### 4. Add Route Guard

```astro
---
// src/pages/testimonials.astro
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('testimonials')) {
  return Astro.redirect('/');
}

import TestimonialsPage from '@/features/testimonials/pages/index.astro';
---

<TestimonialsPage />
```

### 5. Add to Navigation (Conditional)

```typescript
if (isFeatureEnabled('testimonials')) {
  nav.push({ label: 'Testimonials', href: '/testimonials' });
}
```

### 6. Use in Homepage (Conditional)

```astro
---
// src/pages/index.astro
import { isFeatureEnabled } from '@/lib/features';
const showTestimonials = isFeatureEnabled('testimonials');
---

{showTestimonials && (
  <Testimonials />
)}
```

## 🔄 Complete Flow Example

### User Deploys to Railway

```
1. User clicks "Deploy to Railway"
2. Railway shows form:
   ✅ Enable PDF System
   ✅ Enable Chat
   ❌ Enable Voice Assistant (unchecked)
   ❌ Enable AI Agent (unchecked)
3. Railway sets env vars:
   FEATURE_PDF_SYSTEM=true
   FEATURE_CHAT=true
   FEATURE_VOICE_ASSISTANT=false
   FEATURE_AI_AGENT=false
```

### Build Time

```
1. Railway runs: npm run build
2. prebuild script runs: generate-site-config.js
3. site-config.json created:
   {
     "features": {
       "pdf-system": true,
       "chat": true,
       "voice-assistant": false,
       "ai-agent": false
     }
   }
4. Astro build runs with this config
```

### Runtime

```
User visits /voice-assistant
  ↓
Page checks: isFeatureEnabled('voice-assistant')
  ↓
Returns false → Redirect to /
  ↓
User never sees disabled feature
```

## 🎯 Best Practices

### 1. Feature Independence

Each feature should work standalone:

```
features/pdf-system/
├── components/     # Everything PDF needs
├── api/           # PDF endpoints
├── pages/         # PDF pages
└── config.ts      # PDF settings
```

### 2. Graceful Degradation

```astro
---
// Page works without optional features
const showChat = isFeatureEnabled('chat');
const showMaps = isFeatureEnabled('maps');
---

<main>
  <h1>Project</h1>
  <!-- Core content always shows -->
  
  {showChat && <ChatWidget />}
  {showMaps && <MapWidget />}
</main>
```

### 3. Clear Dependencies

Document what each feature needs:

```json
// features/voice-assistant/config.json
{
  "name": "Voice Assistant",
  "requires": {
    "env": ["VAPI_API_KEY", "PUBLIC_VAPI_ASSISTANT_ID"],
    "features": [],
    "dependencies": ["@vapi-ai/web"]
  }
}
```

### 4. Feature Validation

Check if feature is properly configured:

```typescript
// src/lib/features.ts
export function isFeatureEnabled(name: string): boolean {
  const config = getSiteConfig();
  
  if (!config.features[name]) {
    return false;
  }
  
  // Optional: Validate dependencies
  if (name === 'voice-assistant') {
    if (!process.env.VAPI_API_KEY) {
      console.warn('⚠️ Voice Assistant enabled but VAPI_API_KEY missing');
      return false;
    }
  }
  
  return true;
}
```

## 📋 Summary

**3-Layer System:**

1. **Railway Template** → User selects features during deploy
2. **Build Script** → Generates `site-config.json` from env vars
3. **Runtime Guards** → Pages/components check flags

**For pages in features:**

- ✅ **Recommended**: Feature owns its pages, route proxies in `src/pages/`
- ✅ **Alternative**: Direct pages with guards at the top
- ✅ **Advanced**: Dynamic routing system

**This gives you:**
- ✅ Easy Railway deployment with feature selection
- ✅ Per-client feature configuration
- ✅ No broken links to disabled features
- ✅ Clean separation of concerns
- ✅ Easy to add/remove features

🚀 **Next:** Want me to create the `generate-site-config.js` script and update your Railway template?

