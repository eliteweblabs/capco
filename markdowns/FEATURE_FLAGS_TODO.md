# Component Feature Flag Implementation Checklist

## ✅ Already Implemented

### Aside.astro
- ✅ Chat widgets (HttpChatWidget, CampfireChatWidget)
- Checks `features.chat` flag
- Gracefully hides if disabled

## 🔄 High Priority - Implement Next

### 1. Voice Assistant Page (`src/pages/voice-assistant-vapi.astro`)
```astro
---
import { isFeatureEnabled } from '../lib/features';

// Redirect if feature disabled
if (!isFeatureEnabled('voiceAssistant')) {
  return Astro.redirect('/');
}
---
```

### 2. Index/Home Page (`src/pages/index.astro`)
```astro
---
import { isFeatureEnabled } from '../lib/features';

const showTestimonials = isFeatureEnabled('testimonials');
const showMap = isFeatureEnabled('mapWidget');
---

{showTestimonials && <Testimonials />}
{showMap && <MapboxWidget />}
```

### 3. SpeedDial Actions (`src/components/common/SpeedDial.astro`)
```astro
---
import { getSiteConfig } from '@/lib/content';

const config = getSiteConfig();
const actions = [];

if (config.features.voiceAssistant) {
  actions.push({ icon: 'microphone', href: '/voice-assistant' });
}
if (config.features.chat) {
  actions.push({ icon: 'message', action: 'toggle-chat' });
}
---
```

## 📝 Medium Priority

### 4. Navigation (`src/pages/api/utils/navigation.ts`)
Add conditional nav items based on features:
```typescript
import { isFeatureEnabled } from '@/lib/features';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
];

if (isFeatureEnabled('blog')) {
  navItems.push({ label: 'Blog', href: '/blog' });
}

if (isFeatureEnabled('pricing')) {
  navItems.push({ label: 'Pricing', href: '/pricing' });
}
```

### 5. Dashboard Widgets
Add feature flags for optional dashboard sections

### 6. Footer Links
Conditionally show newsletter signup, blog links, etc.

## 🎯 Pattern to Follow

### Component-Level Check (Preferred)
```astro
---
// At top of component
import { isFeatureEnabled } from '@/lib/features';

if (!isFeatureEnabled('myFeature')) {
  return null; // Don't render at all
}
---

<div>Component content</div>
```

### Parent-Level Check (Alternative)
```astro
---
import { isFeatureEnabled } from '@/lib/features';
import OptionalComponent from './OptionalComponent.astro';

const showOptional = isFeatureEnabled('myFeature');
---

{showOptional && <OptionalComponent />}
```

## 🧪 Testing

### Test with Feature Enabled
```json
// site-config.json
{
  "features": {
    "chat": true,
    "voiceAssistant": true
  }
}
```

```bash
npm run dev
# Verify components appear
```

### Test with Feature Disabled
```json
// site-config.json
{
  "features": {
    "chat": false,
    "voiceAssistant": false
  }
}
```

```bash
npm run dev
# Verify components hidden
# Verify no errors
# Verify page still works
```

## 📋 Components to Update

### Confirmed Components (from codebase)
- [ ] `voice-assistant-vapi.astro` - Redirect if disabled
- [ ] `voice-assistant.astro` - Redirect if disabled  
- [ ] `SpeedDial.astro` - Conditional actions
- [ ] `MapboxWidget.astro` - Check mapWidget feature
- [ ] `index.astro` - Optional sections
- [ ] Navigation system - Conditional menu items
- [ ] Footer - Optional sections

### Potential Components (need confirmation)
- [ ] `Testimonials.astro` - If exists
- [ ] `Blog` components - If exists
- [ ] `Pricing` components - If exists
- [ ] `Newsletter` component - If exists
- [ ] `Analytics` widgets - If exists

## 🔍 Find Components to Update

```bash
# Find all .astro files
find src/components -name "*.astro" | head -20

# Search for specific features
grep -r "voice" src/components --include="*.astro"
grep -r "chat" src/components --include="*.astro"
grep -r "map" src/components --include="*.astro"
```

## 📦 Implementation Steps

1. **Start with high-impact** - Voice assistant, chat (done ✅)
2. **Test each change** - Verify both enabled/disabled states
3. **Update navigation** - Remove links to disabled features
4. **Document each feature** - Add comments explaining what the flag does
5. **Update scripts** - Ensure setup scripts explain feature flags

## 🎯 Quick Wins

These are easiest to implement:

1. ✅ Chat widgets in Aside - **DONE**
2. Voice assistant page redirect - 5 min
3. MapboxWidget conditional render - 5 min
4. SpeedDial conditional actions - 10 min

## 💡 Best Practices Reminder

1. **Component-level checks** when possible (cleaner)
2. **Early returns** for disabled features
3. **No errors** if feature disabled (graceful degradation)
4. **Test both states** - enabled AND disabled
5. **Document the feature** in site-config.json.example

## Next Action

**Update `voice-assistant-vapi.astro` next** - It's high-impact and straightforward:

```astro
---
import { isFeatureEnabled } from '../lib/features';

if (!isFeatureEnabled('voiceAssistant')) {
  return Astro.redirect('/');
}

// Rest of component...
---
```

Done! That's the pattern for all components. 🎯

