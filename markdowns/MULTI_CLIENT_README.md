# 🔥 Multi-Client Fire Protection System

> Deploy to unlimited clients with unique branding and content, using a single codebase.

## 🎯 What This Is

A **markdown + JSON content system** for deploying the fire protection platform to multiple clients. Each deployment gets unique branding, content, and configuration while sharing the same core codebase.

**Perfect for:** White-label SaaS, agencies managing multiple clients, franchise systems.

## ⚡ Quick Start

```bash
# 1. Setup first client
./scripts/setup-client.sh my-first-client
./scripts/init-content.sh

# 2. Customize
vim site-config.json          # Company info, colors, features
vim content/pages/home.md     # Homepage content
vim content/pages/contact.md  # Contact page content

# 3. Test
cp configs/my-first-client.env .env
npm run dev

# 4. Deploy
railway init --name my-first-client
./scripts/deploy-client.sh my-first-client
```

**Done! Your first client is live.** 🚀

## 📋 System Overview

### The Problem

You want to deploy your fire protection system to multiple clients, but:
- Each client needs their own branding (colors, logo, name)
- Each client needs unique content (different contact forms, text)
- Each client needs separate API keys (Supabase, VAPI, Stripe)
- You don't want to maintain separate codebases
- You don't want the complexity of a full CMS

### The Solution

**Gitignored content layer** that sits on top of shared code:

```
┌─────────────────────┐
│   Shared Codebase   │  ← One codebase in git
│   (Components,      │
│    Logic, Pages)    │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ↓             ↓
┌─────────┐  ┌─────────┐
│Client A │  │Client B │
│         │  │         │
│ content/│  │content/ │  ← Gitignored (unique)
│ config  │  │config   │
│ .env    │  │.env     │
│         │  │         │
│🔵 Blue  │  │🔴 Red   │  ← Different branding
│ "Acme"  │  │"Smith"  │
└─────────┘  └─────────┘
```

### Key Innovation

**Three layers of configuration:**

1. **Environment Variables** (`.env`) - API keys, secrets
2. **Site Configuration** (`site-config.json`) - Company info, colors, navigation
3. **Content Files** (`content/*.md`) - Page content with frontmatter

**All three are gitignored** and unique per deployment!

## 🗂️ File Structure

```
astro-supabase-main/
│
├── src/                     ✅ IN GIT (Shared)
│   ├── lib/content.ts       ← Content management system
│   ├── pages/
│   │   └── contact.astro    ← Uses getPageContent('contact')
│   └── components/          ← All shared
│
├── content/                 ❌ GITIGNORED (Unique)
│   ├── pages/
│   │   ├── home.md          ← Hero, sections, markdown
│   │   ├── contact.md       ← Form URL, text
│   │   └── about.md         ← Company story
│   └── README.md            ✅ Docs only in git
│
├── site-config.json         ❌ GITIGNORED (Unique)
│                            ← Colors, navigation, features
├── site-config.json.example ✅ Template in git
│
├── .env                     ❌ GITIGNORED (Unique)
│                            ← API keys, secrets
├── .env.template            ✅ Template in git
│
├── configs/                 ❌ GITIGNORED
│   ├── client-a.env         ← Saved client configs
│   ├── client-b.env
│   └── README.md            ✅ Docs only in git
│
└── scripts/                 ✅ IN GIT
    ├── init-content.sh      ← Initialize content
    ├── setup-client.sh      ← Create client config
    ├── deploy-client.sh     ← Deploy to Railway
    └── update-all-clients.sh← Update all deployments
```

## 🚀 Common Workflows

### Add New Client

```bash
# Full setup (15 minutes)
./scripts/setup-client.sh acme-fire
./scripts/init-content.sh

# Customize content
vim site-config.json          # Name, colors, logo
vim content/pages/home.md     # Homepage text
vim content/pages/contact.md  # Contact form URL

# Deploy
cp configs/acme-fire.env .env
npm run dev                   # Test
./scripts/deploy-client.sh acme-fire
```

### Update All Clients (Code Changes)

```bash
# Make changes
vim src/components/Dashboard.astro

# Push update to ALL clients
git add . && git commit -m "fix: dashboard"
./scripts/update-all-clients.sh

# ✅ All clients get update
# ✅ Each keeps unique branding
```

### Update Single Client (Content)

```bash
# Load client
cp configs/acme-fire.env .env

# Edit content
vim content/pages/contact.md

# Deploy only that client
./scripts/deploy-client.sh acme-fire
```

## 📝 Example: Customizing Contact Page

### Code (Shared - `src/pages/contact.astro`)

```astro
---
import { getPageContent } from '../lib/content';
const page = await getPageContent('contact');
---

<Hero title={page.hero.title} />
{page.showForm && <iframe src={page.formUrl} />}
<div set:html={page.content} />
```

### Content (Unique - `content/pages/contact.md`)

```markdown
---
title: "Contact Acme Fire"
hero:
  title: "Get in Touch"
  subtitle: "24/7 Emergency Services"
formUrl: "https://acme.form.com/contact"
showForm: true
---

# Emergency Services Available

Call us anytime for urgent fire protection needs.

## Business Hours
Monday-Friday: 9am-5pm
```

### Config (Unique - `site-config.json`)

```json
{
  "site": {
    "name": "Acme Fire Protection",
    "phone": "+15551234567",
    "email": "contact@acmefire.com"
  },
  "branding": {
    "primaryColor": "#0066CC"
  }
}
```

**Result:** Same page structure, completely different branding and content!

## ✅ What's Customizable

| Element | How | Per Client |
|---------|-----|------------|
| Colors | `site-config.json` | ✅ |
| Logo | `site-config.json` | ✅ |
| Company Info | `site-config.json` | ✅ |
| Navigation | `site-config.json` | ✅ |
| Features | `site-config.json` | ✅ |
| Page Titles | `content/*.md` frontmatter | ✅ |
| Page Content | `content/*.md` markdown | ✅ |
| Form URLs | `content/*.md` frontmatter | ✅ |
| API Keys | `.env` | ✅ |
| **Page Structure** | `src/pages/*.astro` | ❌ (same) |
| **Components** | `src/components/` | ❌ (same) |
| **Business Logic** | `src/lib/` | ❌ (same) |

## 📚 Complete Documentation

### Getting Started
1. **[SYSTEM_OVERVIEW.md](./markdowns/SYSTEM_OVERVIEW.md)** - Visual overview (start here!)
2. **[QUICK_START_MULTI_CLIENT.md](./markdowns/QUICK_START_MULTI_CLIENT.md)** - Step-by-step setup guide

### Strategy & Planning
3. **[MULTI_SITE_DEPLOYMENT_STRATEGY.md](./markdowns/MULTI_SITE_DEPLOYMENT_STRATEGY.md)** - Overall deployment strategy
4. **[DEPLOYMENT_CMS_ANALYSIS.md](./markdowns/DEPLOYMENT_CMS_ANALYSIS.md)** - When to use CMS vs this approach

### Implementation
5. **[IMPLEMENTATION_COMPLETE.md](./markdowns/IMPLEMENTATION_COMPLETE.md)** - Complete implementation details
6. **[CLIENT_BRANDING_GUIDE.md](./markdowns/CLIENT_BRANDING_GUIDE.md)** - Logo, colors, fonts guide

### Content Directories
- `content/README.md` - Content system documentation
- `configs/README.md` - Client config documentation

## 🛠️ Installation

```bash
# 1. Clone repo
git clone <repo-url>
cd astro-supabase-main

# 2. Install dependencies
npm install

# 3. Setup first client
./scripts/setup-client.sh my-first-client
./scripts/init-content.sh

# 4. Configure
vim site-config.json
vim content/pages/*.md

# 5. Test
cp configs/my-first-client.env .env
npm run dev

# 6. Deploy
railway init --name my-first-client
./scripts/deploy-client.sh my-first-client
```

## 🔧 Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `init-content.sh` | Initialize content directory | `./scripts/init-content.sh` |
| `setup-client.sh` | Interactive client setup | `./scripts/setup-client.sh CLIENT_NAME` |
| `deploy-client.sh` | Deploy to Railway | `./scripts/deploy-client.sh CLIENT_NAME` |
| `update-all-clients.sh` | Push updates to all | `./scripts/update-all-clients.sh` |

## 💡 Pro Tips

1. **Keep a template client** - Maintain good default content for new clients
2. **Backup content separately** - It's gitignored, so backup `content/` and `site-config.json`
3. **Test locally first** - Always `npm run dev` before deploying
4. **Use Railway environments** - Create staging environment for testing updates
5. **Document customizations** - Keep notes on what's unique per client

## 🐛 Troubleshooting

### "Cannot find content file"
```bash
# Initialize content directory
./scripts/init-content.sh
```

### "Gray-matter not found"
```bash
# Install dependency
npm install gray-matter
```

### "Site config not found"
```bash
# Copy from example
cp site-config.json.example site-config.json
```

### Content not updating
```bash
# Clear cache
rm -rf .astro dist
npm run dev
```

## 🔐 Security & Backups

```bash
# Backup client content (recommended)
tar -czf backup-$(date +%Y%m%d).tar.gz \
  content/ \
  site-config.json \
  configs/*.env

# Encrypt backup
gpg -c backup-*.tar.gz

# Store in secure location (S3, 1Password, etc.)
```

## 🎯 Use Cases

### ✅ Perfect For:
- White-label SaaS with consistent features
- Agency managing multiple clients
- Franchise/multi-location businesses
- 2-100 clients with similar needs
- Want to avoid CMS complexity

### ❌ Not For:
- Single deployment (just use env vars)
- Clients need real-time updates
- Visual page builder required
- Non-technical users editing content
- Completely different features per client

## 🔮 Roadmap

### Phase 1: Current ✅
- Markdown content system
- JSON configuration
- Deployment scripts
- Documentation

### Phase 2: Future
- Admin UI for editing content
- Railway volumes for storage
- Content API
- Automated backups
- Client dashboard

### Phase 3: Full CMS (If Needed)
- Visual page builder
- Database-backed
- Multi-user editing
- Client self-service

## 📞 Support

- Review [documentation](./markdowns/) for detailed guides
- Check [QUICK_START](./markdowns/QUICK_START_MULTI_CLIENT.md) for step-by-step
- See [TROUBLESHOOTING](./markdowns/IMPLEMENTATION_COMPLETE.md#-troubleshooting) section

## 📄 License

[Your License Here]

---

**Ready to deploy to multiple clients!** 🚀

Start with the [Quick Start Guide](./markdowns/QUICK_START_MULTI_CLIENT.md).

