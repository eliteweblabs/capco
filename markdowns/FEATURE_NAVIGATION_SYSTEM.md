# Feature-Driven Navigation System

## 🎯 The Solution

**Features self-describe their navigation** in `site-config.json`. The sidebar dynamically builds from enabled features.

## 📁 New Structure

### site-config.json (Self-Describing Features)

```json
{
  "features": {
    "pdf-system": {
      "enabled": true,
      "navigation": {
        "label": "PDF System",
        "href": "/admin/pdf-system",
        "icon": "adobe",
        "position": 30,           // ← Controls order
        "section": "admin",       // ← Groups features
        "roles": ["Admin", "Staff"] // ← Access control
      }
    },
    "chat": {
      "enabled": true,
      "navigation": null  // ← Widget feature, no nav entry
    }
  }
}
```

## 🔧 How It Works

### 1. Feature Declares Navigation

Each feature in `site-config.json` can include navigation metadata:

```json
"voice-assistant": {
  "enabled": true,
  "navigation": {
    "label": "Voice Assistant",
    "href": "/voice-assistant-vapi",
    "icon": "microphone",
    "position": 50,
    "section": "tools",
    "roles": ["Admin", "Staff", "Client"]
  }
}
```

**Fields:**
- `enabled` - Feature on/off
- `navigation.label` - Display name
- `navigation.href` - Route
- `navigation.icon` - Icon name (from SimpleIcon)
- `navigation.position` - Sort order (lower = higher in list)
- `navigation.section` - Group ("admin", "tools", etc.)
- `navigation.roles` - Who can see it

### 2. Helper Reads Features

```typescript
// src/lib/feature-navigation.ts
import { getSiteConfig } from './content';

export function getFeatureNavigation(userRole?: string) {
  const config = getSiteConfig();
  const navItems = [];

  for (const [key, data] of Object.entries(config.features)) {
    if (!data.enabled || !data.navigation) continue;
    
    // Check role access
    if (userRole && data.navigation.roles) {
      if (!data.navigation.roles.includes(userRole)) continue;
    }

    navItems.push(data.navigation);
  }

  // Sort by position
  return navItems.sort((a, b) => a.position - b.position);
}
```

### 3. Sidebar Uses Helper

```astro
---
import { getSectionNavigation } from '@/lib/feature-navigation';

const currentRole = currentUser?.profile?.role;
const adminNavItems = getSectionNavigation('admin', currentRole);
const toolsNavItems = getSectionNavigation('tools', currentRole);
---

<ul>
  <!-- Dashboard always shows -->
  <li><a href="/dashboard">Dashboard</a></li>

  <!-- Dynamic admin features -->
  {adminNavItems.map((item) => (
    <li>
      <a href={item.href}>
        <SimpleIcon name={item.icon} />
        {item.label}
      </a>
    </li>
  ))}

  <!-- Dynamic tools features -->
  {toolsNavItems.map((item) => (
    <li>
      <a href={item.href}>
        <SimpleIcon name={item.icon} />
        {item.label}
      </a>
    </li>
  ))}
</ul>
```

## 🎨 Complete Example

### Client A: Full Features

```json
{
  "features": {
    "pdf-system": {
      "enabled": true,
      "navigation": {
        "label": "PDF System",
        "href": "/admin/pdf-system",
        "icon": "adobe",
        "position": 30,
        "section": "admin",
        "roles": ["Admin", "Staff"]
      }
    },
    "analytics": {
      "enabled": true,
      "navigation": {
        "label": "Analytics",
        "href": "/admin/analytics",
        "icon": "bar-chart-3",
        "position": 40,
        "section": "admin",
        "roles": ["Admin"]
      }
    },
    "voice-assistant": {
      "enabled": true,
      "navigation": {
        "label": "Voice Assistant",
        "href": "/voice-assistant-vapi",
        "icon": "microphone",
        "position": 50,
        "section": "tools",
        "roles": ["Admin", "Staff", "Client"]
      }
    }
  }
}
```

**Result:** Sidebar shows all three in order (30, 40, 50)

### Client B: Minimal Features

```json
{
  "features": {
    "pdf-system": {
      "enabled": false,
      "navigation": null
    },
    "analytics": {
      "enabled": true,
      "navigation": {
        "label": "Analytics",
        "href": "/admin/analytics",
        "icon": "bar-chart-3",
        "position": 40,
        "section": "admin",
        "roles": ["Admin"]
      }
    },
    "voice-assistant": {
      "enabled": false,
      "navigation": null
    }
  }
}
```

**Result:** Sidebar only shows Analytics

## 🔄 Position System

Lower numbers = higher in the sidebar:

```
Position   Feature           Section
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0          (Dashboard)       core
10         Discussions       admin
20         Calendar          admin
30         PDF System        admin
31         PDF Certify       admin
40         Analytics         admin
41         Finance           admin
50         Voice Assistant   tools
51         AI Agent          tools
60         Global Activity   admin
70         Users             admin
```

**Gaps of 10** allow inserting features between existing ones.

## 📦 Widget Features vs Page Features

### Page Features (Has Navigation)

```json
"pdf-system": {
  "enabled": true,
  "navigation": {
    "label": "PDF System",
    "href": "/admin/pdf-system",
    "icon": "adobe",
    "position": 30,
    "section": "admin",
    "roles": ["Admin"]
  }
}
```

### Widget Features (No Navigation)

```json
"chat": {
  "enabled": true,
  "navigation": null  // ← Appears in sidebar/footer, not nav
}
```

## 🎯 Section Groups

Organize features by section:

```typescript
const sections = {
  'admin': 'Administration',
  'tools': 'Tools & Utilities',
  'reports': 'Reports',
  'settings': 'Settings'
};
```

In sidebar:

```astro
{adminItems.length > 0 && (
  <>
    <li class="section-header">Administration</li>
    {adminItems.map(item => <NavItem {...item} />)}
  </>
)}

{toolsItems.length > 0 && (
  <>
    <li class="section-header">Tools</li>
    {toolsItems.map(item => <NavItem {...item} />)}
  </>
)}
```

## 🔐 Role-Based Access

Features declare who can see them:

```json
"analytics": {
  "navigation": {
    "roles": ["Admin"]  // Only admins see this
  }
}

"discussions": {
  "navigation": {
    "roles": ["Admin", "Staff", "Client"]  // Everyone sees this
  }
}
```

The helper filters automatically:

```typescript
if (userRole && nav.roles && !nav.roles.includes(userRole)) {
  continue; // Skip this nav item
}
```

## ✅ Benefits

### 1. **Add Feature = Auto Navigation**

Add to `site-config.json`:
```json
"invoices": {
  "enabled": true,
  "navigation": {
    "label": "Invoices",
    "href": "/admin/invoices",
    "icon": "receipt",
    "position": 42,
    "section": "admin",
    "roles": ["Admin"]
  }
}
```

**Navigation automatically updates!** No code changes needed.

### 2. **Easy Reordering**

Just change position numbers:
```json
"pdf-system": { "position": 30 }  →  "pdf-system": { "position": 15 }
```

### 3. **Per-Client Customization**

Each client's `site-config.json` controls their sidebar.

### 4. **No Hardcoded Navigation**

Old way (hardcoded):
```astro
<li><a href="/admin/pdf-system">PDF System</a></li>
<li><a href="/admin/analytics">Analytics</a></li>
```

New way (dynamic):
```astro
{adminNavItems.map(item => (
  <li><a href={item.href}>{item.label}</a></li>
))}
```

### 5. **Type Safety**

```typescript
interface FeatureNavigation {
  label: string;
  href: string;
  icon?: string;
  position: number;
  section: string;
  roles?: string[];
}
```

## 🚀 Usage Examples

### Get All Navigation

```typescript
import { getFeatureNavigation } from '@/lib/feature-navigation';

const allNavItems = getFeatureNavigation();
// All enabled features with navigation, sorted by position
```

### Get Section Navigation

```typescript
import { getSectionNavigation } from '@/lib/feature-navigation';

const adminItems = getSectionNavigation('admin');
const toolsItems = getSectionNavigation('tools');
```

### Get Navigation for User Role

```typescript
const adminOnlyItems = getFeatureNavigation('Admin');
// Only shows items where roles includes 'Admin'
```

### Get Grouped Navigation

```typescript
import { getGroupedNavigation } from '@/lib/feature-navigation';

const grouped = getGroupedNavigation('Staff');
// {
//   admin: [...],
//   tools: [...],
//   reports: [...]
// }
```

## 📝 Migration Guide

### Before (Hardcoded)

```astro
<li>
  <a href="/admin/pdf-system">
    <SimpleIcon name="adobe" />
    PDF System
  </a>
</li>
<li>
  <a href="/admin/analytics">
    <SimpleIcon name="bar-chart-3" />
    Analytics
  </a>
</li>
```

### After (Dynamic)

```astro
---
import { getSectionNavigation } from '@/lib/feature-navigation';
const adminItems = getSectionNavigation('admin', currentRole);
---

{adminItems.map((item) => (
  <li>
    <a href={item.href}>
      {item.icon && <SimpleIcon name={item.icon} />}
      {item.label}
    </a>
  </li>
))}
```

## 🎯 Best Practices

### 1. Use Position Gaps

Leave gaps for future features:
```
10, 20, 30, 40, 50  ✅ Good (can insert 25, 35, etc.)
1, 2, 3, 4, 5       ❌ Bad (hard to insert between)
```

### 2. Group by Section

```
admin    - Core admin features
tools    - Utility features
reports  - Reporting features
settings - Configuration
```

### 3. Widget Features Get null

```json
"chat": { "navigation": null }      // ← Widget
"maps": { "navigation": null }      // ← Widget
"pdf-system": { "navigation": {...} } // ← Page feature
```

### 4. Document Positions

```json
// Position ranges:
// 0-19:   Core features (dashboard, discussions)
// 20-39:  Document features (PDF, calendar)
// 40-59:  Analytics features
// 60-79:  Admin features (users, activity)
// 80-99:  Tools features
```

## 🎉 Summary

**Features now self-describe their navigation:**

1. ✅ Add feature to `site-config.json` with navigation metadata
2. ✅ Sidebar automatically includes it (sorted by position)
3. ✅ Role-based access automatically enforced
4. ✅ Easy to reorder (change position number)
5. ✅ Per-client customization (each has own config)
6. ✅ No hardcoded navigation in components

**One config file controls everything!** 🚀

