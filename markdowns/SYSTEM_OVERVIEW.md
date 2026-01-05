# Multi-Client Deployment System

## Summary

**Problem Solved:** Deploy the same fire protection platform to multiple clients with unique branding and content, without changing code or creating a complex CMS.

**Solution:** Markdown-based content + JSON configuration, both gitignored and unique per deployment.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GIT REPOSITORY                          │
│                   (Shared Codebase)                         │
│                                                             │
│  src/pages/contact.astro  ←─── Uses content system        │
│  src/lib/content.ts       ←─── Reads markdown + JSON       │
│  src/components/          ←─── Shared components           │
│                                                             │
│  content/README.md        ←─── Documentation only          │
│  site-config.json.example ←─── Template only               │
│  .env.template            ←─── Template only               │
│                                                             │
│  scripts/                                                  │
│  ├── init-content.sh      ←─── Initialize content         │
│  ├── setup-client.sh      ←─── Create client config       │
│  ├── deploy-client.sh     ←─── Deploy to Railway          │
│  └── update-all-clients.sh←─── Push updates to all        │
└─────────────────────────────────────────────────────────────┘
                            │
                     git pull / push
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌─────────────────────┐              ┌─────────────────────┐
│   DEPLOYMENT A      │              │   DEPLOYMENT B      │
│   (Acme Fire)       │              │   (Smith Safety)    │
│                     │              │                     │
│  ❌ GITIGNORED:     │              │  ❌ GITIGNORED:     │
│  ───────────────    │              │  ───────────────    │
│  content/           │              │  content/           │
│  ├── pages/         │              │  ├── pages/         │
│  │   ├── home.md    │              │  │   ├── home.md    │
│  │   ├── contact.md │              │  │   ├── contact.md │
│  │   └── about.md   │              │  │   └── about.md   │
│                     │              │                     │
│  site-config.json   │              │  site-config.json   │
│  {                  │              │  {                  │
│    "name": "Acme",  │              │    "name": "Smith", │
│    "color": "blue"  │              │    "color": "red"   │
│  }                  │              │  }                  │
│                     │              │                     │
│  .env               │              │  .env               │
│  SUPABASE_URL=...   │              │  SUPABASE_URL=...   │
│  VAPI_KEY=...       │              │  VAPI_KEY=...       │
│                     │              │                     │
│  ✅ RESULT:         │              │  ✅ RESULT:         │
│  🔵 Blue theme      │              │  🔴 Red theme       │
│  "Acme" everywhere  │              │  "Smith" everywhere │
│  Custom content     │              │  Different content  │
└─────────────────────┘              └─────────────────────┘
```

## Key Files

### In Git (Shared)
```
src/
├── lib/content.ts           ← Content management system
├── pages/
│   └── contact.astro        ← Uses: getPageContent('contact')
└── components/              ← All shared

.gitignore                   ← Ignores: content/, site-config.json
.env.template                ← Template for copying
site-config.json.example     ← Template for copying
content/README.md            ← Docs only

scripts/
├── init-content.sh          ← Creates content/ directory
├── setup-client.sh          ← Interactive client setup
├── deploy-client.sh         ← Deploy to Railway
└── update-all-clients.sh    ← Push to all deployments
```

### Gitignored (Unique Per Client)
```
content/
├── pages/
│   ├── home.md              ← Hero, sections, content
│   ├── contact.md           ← Form URL, text
│   └── about.md             ← Company story
└── README.md

site-config.json             ← Colors, nav, features
.env                         ← API keys, secrets
configs/
└── *.env                    ← Saved client configs
```

## Workflow Examples

### 1. Setup First Client (15 min)

```bash
# Step 1: Create environment config
./scripts/setup-client.sh acme-fire
# → Creates configs/acme-fire.env
# → Prompts for: company info, API keys, etc.

# Step 2: Initialize content
./scripts/init-content.sh
# → Creates content/ directory
# → Copies templates for home, contact, about
# → Creates site-config.json

# Step 3: Customize
vim site-config.json          # Company name, colors
vim content/pages/home.md      # Homepage hero, content
vim content/pages/contact.md   # Form URL, text

# Step 4: Test
cp configs/acme-fire.env .env
npm run dev

# Step 5: Deploy
railway init --name acme-fire
./scripts/deploy-client.sh acme-fire
# ✅ Live at https://acme-fire.railway.app
```

### 2. Add Second Client (10 min)

```bash
# Backup first client
mkdir -p client-backups/acme-fire
cp -r content/ client-backups/acme-fire/
cp site-config.json client-backups/acme-fire/

# Setup second client
./scripts/setup-client.sh smith-safety
./scripts/init-content.sh

# Customize for Smith
vim site-config.json          # Different colors, name
vim content/pages/contact.md   # Different form, text

# Test
cp configs/smith-safety.env .env
npm run dev

# Deploy
railway init --name smith-safety
./scripts/deploy-client.sh smith-safety
# ✅ Live at https://smith-safety.railway.app
```

### 3. Push Code Update to All (5 min)

```bash
# Fix bug in dashboard
vim src/components/Dashboard.astro

# Test with one client
cp configs/acme-fire.env .env
npm run dev

# Push to git
git add .
git commit -m "fix: dashboard layout issue"
git push

# Deploy to all clients
./scripts/update-all-clients.sh
# ✅ Both acme-fire and smith-safety get update
# ✅ Each keeps their unique branding/content
```

### 4. Update Single Client Content (2 min)

```bash
# Load client config
cp configs/acme-fire.env .env

# Edit content
vim content/pages/contact.md
# Change: formUrl, hero title, etc.

# Deploy
./scripts/deploy-client.sh acme-fire
# ✅ Only acme-fire updated
# ✅ smith-safety unchanged
```

## Content System in Action

### contact.astro (Simplified)

```astro
---
import { getPageContent, getSiteConfig } from '../lib/content';

// Loads from content/pages/contact.md
const page = await getPageContent('contact');

// Loads from site-config.json
const config = getSiteConfig();
---

<App title={`${page.title} - ${config.site.name}`}>
  <Hero 
    title={page.hero.title} 
    subtitle={page.hero.subtitle} 
  />
  
  {page.showForm && (
    <iframe src={page.formUrl} />
  )}
  
  <div set:html={page.content} />
</App>
```

### content/pages/contact.md

```markdown
---
title: "Contact Us"
hero:
  title: "Get in Touch"
  subtitle: "We're here to help 24/7"
formUrl: "https://forms.acmefire.com/contact"
showForm: true
---

## Emergency Services

Call us anytime for emergency fire protection services.

## Business Hours

Monday-Friday: 9am-5pm
Saturday: By appointment
```

### site-config.json

```json
{
  "site": {
    "name": "Acme Fire Protection",
    "phone": "+15551234567",
    "email": "contact@acmefire.com"
  },
  "branding": {
    "primaryColor": "#0066CC",
    "logoSvg": "<svg>...</svg>"
  },
  "navigation": {
    "main": [
      { "label": "Home", "href": "/" },
      { "label": "Contact", "href": "/contact" }
    ]
  },
  "features": {
    "voiceAssistant": true,
    "blog": false
  }
}
```

## Migration Path

### Phase 1: Current Implementation ✅
- Markdown content
- JSON configuration
- File-based (gitignored)
- Manual deployment

### Phase 2: Enhanced (Future)
- Railway volumes for storage
- Content API for external access
- Backup automation
- Content versioning

### Phase 3: Full CMS (If Needed)
- Admin UI for editing
- Database-backed
- Visual page builder
- Client self-service

## Benefits

### ✅ Pros
1. **Simple** - Markdown + JSON, no database needed
2. **Fast** - File-based, cached
3. **Flexible** - Can customize per client easily
4. **Maintainable** - Clear separation of code vs content
5. **Scalable** - Works for 1 or 100 clients
6. **Git-Safe** - Content gitignored, no conflicts
7. **Upgradeable** - Can migrate to DB later

### ⚠️ Cons
1. **Manual Deployment** - Must redeploy for content changes
2. **No Visual Editor** - Edit markdown/JSON manually
3. **File-Based** - Need backup strategy
4. **Developer-Focused** - Not for non-technical users (yet)

## When to Use

### ✅ Perfect For:
- White-label SaaS with consistent features
- 2-50 clients with similar needs
- Content changes monthly/weekly
- You control deployments
- Want to avoid CMS complexity

### ❌ Not For:
- Clients need real-time content updates
- Non-technical users editing content
- Completely different page structures per client
- Need visual page builder
- Single deployment (just use env vars)

## Documentation Index

- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Full implementation details
- **[QUICK_START_MULTI_CLIENT.md](./QUICK_START_MULTI_CLIENT.md)** - Step-by-step guide
- **[DEPLOYMENT_CMS_ANALYSIS.md](./DEPLOYMENT_CMS_ANALYSIS.md)** - When to use CMS vs this
- **[MULTI_SITE_DEPLOYMENT_STRATEGY.md](./MULTI_SITE_DEPLOYMENT_STRATEGY.md)** - Overall strategy
- **[CLIENT_BRANDING_GUIDE.md](./CLIENT_BRANDING_GUIDE.md)** - Logo, colors, assets

## Quick Reference

```bash
# Setup new client
./scripts/setup-client.sh CLIENT_NAME
./scripts/init-content.sh
vim site-config.json
vim content/pages/*.md

# Test locally
cp configs/CLIENT_NAME.env .env
npm run dev

# Deploy
./scripts/deploy-client.sh CLIENT_NAME

# Update all clients
./scripts/update-all-clients.sh
```

---

**System is production-ready!** 🚀

Start with your first client and scale from there.

