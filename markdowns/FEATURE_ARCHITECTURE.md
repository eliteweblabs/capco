# Feature-Based Architecture (Clean Approach)

## 🎯 The Right Way

**One folder per feature. One flag per folder. That's it.**

## 📁 Proposed Structure

```
src/features/
├── pdf-system/
│   ├── components/
│   │   └── PDFSystem.astro
│   ├── api/
│   │   └── templates.ts
│   ├── config.ts
│   └── index.astro          # Entry point
│
├── voice-assistant/
│   ├── components/
│   │   └── VoiceWidget.astro
│   ├── api/
│   │   └── webhook.ts
│   └── index.astro          # Entry point
│
├── ai-agent/
│   ├── components/
│   │   └── ChatAgent.astro
│   ├── api/
│   │   └── chat.ts
│   ├── index.astro          # Entry point
│   └── knowledge.astro
│
├── chat/
│   ├── components/
│   │   ├── HttpChatWidget.astro
│   │   └── CampfireChatWidget.astro
│   └── index.ts             # Export widgets
│
├── maps/
│   ├── components/
│   │   └── MapboxWidget.astro
│   └── index.astro
│
├── calendar/
│   ├── components/
│   │   └── CalComBooking.astro
│   └── api/
│       └── booking.ts
│
└── testimonials/
    └── components/
        └── Testimonials.astro
```

## ⚙️ site-config.json (Super Simple)

```json
{
  "features": {
    "pdf-system": true,
    "voice-assistant": true,
    "ai-agent": false,
    "chat": true,
    "maps": false,
    "calendar": true,
    "testimonials": false
  }
}
```

## 🔌 Feature Entry Point Pattern

Each feature has an `index` file that checks the flag:

```astro
---
// src/features/pdf-system/index.astro
import { isFeatureEnabled } from "@/lib/features";

// Feature name matches folder name
if (!isFeatureEnabled("pdf-system")) {
  return Astro.redirect("/");
}

// Import from within feature folder
import PDFSystem from "./components/PDFSystem.astro";
---

<PDFSystem />
```

## 🎨 Using Features

### In Pages

```astro
---
// src/pages/admin/pdf.astro
import PDFSystemPage from "@/features/pdf-system/index.astro";
---

<PDFSystemPage />
```

### In Components

```astro
---
// src/pages/dashboard.astro
import { isFeatureEnabled } from "@/lib/features";
import ChatWidget from "@/features/chat/components/HttpChatWidget.astro";

const showChat = isFeatureEnabled("chat");
---

{showChat && <ChatWidget />}
```

## 📦 Feature Module Template

```
my-feature/
├── index.astro              # Entry point (checks feature flag)
├── components/              # Feature-specific components
│   └── MyComponent.astro
├── api/                     # Feature API routes (if needed)
│   └── endpoint.ts
├── config.ts                # Feature configuration
├── types.ts                 # Feature types
└── README.md                # Feature documentation
```

## 🔄 Migration Path

### Current State

```
src/
├── components/
│   ├── common/
│   │   ├── MapboxWidget.astro      ❌ Scattered
│   │   ├── ChatWidget.astro        ❌ Scattered
│   │   └── CalComBooking.astro     ❌ Scattered
│   ├── pdf-system/                 ✅ Already grouped!
│   └── vapi/                       ✅ Already grouped!
└── pages/
    ├── voice-assistant-vapi.astro  ❌ Should be in feature
    └── ai-agent/                   ✅ Already grouped!
```

### Target State

```
src/
├── features/                       ✅ All features here
│   ├── pdf-system/
│   ├── voice-assistant/
│   ├── ai-agent/
│   ├── chat/
│   ├── maps/
│   └── calendar/
│
├── components/                     ✅ Only SHARED components
│   └── common/
│       ├── Button.astro
│       ├── Hero.astro
│       └── App.astro
│
└── pages/                          ✅ Just routes
    ├── index.astro
    └── [dynamic].astro
```

## 🚀 Implementation Steps

### Step 1: Create Features Directory

```bash
mkdir -p src/features
```

### Step 2: Move Existing Feature Modules

```bash
# PDF System (already a module!)
mv src/components/pdf-system src/features/pdf-system

# Voice Assistant
mkdir -p src/features/voice-assistant/components
mv src/pages/voice-assistant-vapi.astro src/features/voice-assistant/index.astro
mv src/components/vapi/* src/features/voice-assistant/components/

# AI Agent (already grouped!)
mv src/pages/ai-agent src/features/ai-agent

# Chat
mkdir -p src/features/chat/components
mv src/components/common/*Chat*.astro src/features/chat/components/

# Maps
mkdir -p src/features/maps/components
mv src/components/common/MapboxWidget.astro src/features/maps/components/
mv src/components/widgets/Mapbox3d.astro src/features/maps/components/

# Calendar
mkdir -p src/features/calendar/components
mv src/components/common/CalComBooking.astro src/features/calendar/components/
```

### Step 3: Add Feature Guards

Each feature's `index` file:

```astro
---
import { isFeatureEnabled } from "@/lib/features";

const featureName = "my-feature"; // Matches folder name

if (!isFeatureEnabled(featureName)) {
  return Astro.redirect("/");
}
---
```

### Step 4: Update Imports

```bash
# Old
import PDFSystem from '@/components/pdf-system/PDFSystem.astro';

# New
import PDFSystem from '@/features/pdf-system';
```

## 🎯 Benefits

### ✅ Crystal Clear Structure

- One folder = one feature
- Easy to find everything related to a feature
- No scattered components

### ✅ Easy to Enable/Disable

```json
{
  "features": {
    "my-feature": false // ← One line, entire feature off
  }
}
```

### ✅ Easy to Extract

Want to move a feature to another project?

```bash
cp -r src/features/pdf-system ../other-project/src/features/
```

### ✅ Easy to Understand

```
features/
├── pdf-system/     ← Everything PDF-related
├── chat/           ← Everything chat-related
└── maps/           ← Everything map-related
```

### ✅ Easy to Delete

Feature no longer needed?

```bash
rm -rf src/features/old-feature
# Remove from site-config.json
```

## 📝 Feature Naming Convention

**Use kebab-case** to match folder names:

```json
{
  "features": {
    "pdf-system": true, // ← matches src/features/pdf-system/
    "voice-assistant": true, // ← matches src/features/voice-assistant/
    "ai-agent": false // ← matches src/features/ai-agent/
  }
}
```

## 🔍 Feature Discovery

Features are self-documenting:

```bash
# What features exist?
ls src/features/

# What's in a feature?
ls src/features/pdf-system/

# Read feature docs
cat src/features/pdf-system/README.md
```

## 💡 Advanced: Feature Registry

Auto-discover features:

```typescript
// src/lib/feature-registry.ts
import { readdirSync } from "fs";
import { join } from "path";

export function getAvailableFeatures(): string[] {
  const featuresDir = join(process.cwd(), "src/features");
  return readdirSync(featuresDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

// Usage
const available = getAvailableFeatures();
// ['pdf-system', 'voice-assistant', 'ai-agent', ...]
```

## 🎨 Example: Complete Feature

```
src/features/testimonials/
├── index.ts                 # Export everything
├── components/
│   ├── Testimonials.astro   # Main component
│   ├── TestimonialCard.astro
│   └── TestimonialForm.astro
├── api/
│   └── testimonials.ts      # CRUD endpoints
├── types.ts
│   export interface Testimonial { ... }
├── config.ts
│   export const config = { maxTestimonials: 10 }
└── README.md
```

**Usage:**

```astro
---
import { isFeatureEnabled } from "@/lib/features";
import Testimonials from "@/features/testimonials/components/Testimonials.astro";

const show = isFeatureEnabled("testimonials");
---

{show && <Testimonials />}
```

## 🔒 Feature-Level Environment Variables

Each feature can have its own env vars:

```bash
# .env

# PDF System
PDF_STORAGE_BUCKET=documents
PDF_DEFAULT_SIZE=letter

# Voice Assistant
VAPI_API_KEY=xxx
PUBLIC_VAPI_ASSISTANT_ID=yyy

# Chat
CAMPFIRE_URL=xxx
HTTP_CHAT_ENDPOINT=yyy
```

## 🎯 Summary

**Old Way:**

```
❌ Components scattered everywhere
❌ Hard to find related files
❌ Hard to enable/disable features
❌ Hard to extract to other projects
```

**New Way:**

```
✅ One folder per feature
✅ Everything related is together
✅ One flag to enable/disable
✅ Easy to extract/delete
✅ Self-documenting structure
```

## 📋 Next Steps

1. **Create** `src/features/` directory
2. **Move** existing feature modules
3. **Update** imports
4. **Test** each feature can be enabled/disabled
5. **Document** each feature's README

**This is the WordPress plugin model - and it works perfectly!** 🎉
