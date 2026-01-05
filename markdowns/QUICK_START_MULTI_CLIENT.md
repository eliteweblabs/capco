# Quick Start: Multi-Client Deployment System

## 🚀 TL;DR

This system lets you deploy the fire protection platform to multiple clients, each with their own branding and content, without changing the codebase.

**Key Innovation:** Content and config are **gitignored** and live separately from code!

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│  Main Codebase (Git Repo)                              │
│  - Code, components, features                          │
│  - Shared across ALL clients                           │
│  - Updates push to all deployments                     │
└─────────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────┴────────────────┐
        ↓                                  ↓
┌──────────────────┐            ┌──────────────────┐
│  Client A        │            │  Client B        │
│  ─────────────   │            │  ─────────────   │
│  content/        │            │  content/        │
│  site-config.json│            │  site-config.json│
│  .env            │            │  .env            │
│                  │            │                  │
│  🔵 Blue theme   │            │  🔴 Red theme    │
│  Acme Fire       │            │  Smith Safety    │
└──────────────────┘            └──────────────────┘
```

## What's Gitignored (Client-Specific)

These files are **NOT** in git and are unique per deployment:

1. **`content/`** - Markdown files with page content
2. **`site-config.json`** - Site settings (colors, navigation, features)
3. **`.env`** - Environment variables (API keys, etc.)
4. **`configs/*.env`** - Client configurations

## What's in Git (Shared Code)

- All `.astro` components
- Page structures  
- Business logic
- API endpoints
- Utilities and libraries

## 🎯 When to Use This

### ✅ Perfect For:
- Selling same product to multiple clients
- White-label SaaS platform
- Different branding per deployment
- Some content customization needed
- Want to avoid full CMS complexity

### ❌ Not For:
- Single client deployment (use normal env vars)
- Clients need completely different features
- Need visual page builder
- Clients manage own content frequently

## 📦 Setup: First Time

### 1. Clone and Install

```bash
git clone <your-repo>
cd astro-supabase-main
npm install
```

### 2. Initialize Content System

```bash
# Create content directory and default pages
./scripts/init-content.sh
```

This creates:
- `content/pages/` with default markdown files
- `site-config.json` from example
- Directory structure

### 3. Configure for Your Client

Edit `site-config.json`:

```json
{
  "site": {
    "name": "Acme Fire Protection",
    "slogan": "Safety First",
    "phone": "+15551234567",
    "email": "contact@acmefire.com"
  },
  "branding": {
    "primaryColor": "#825BDD",
    "logoSvg": "<svg>...</svg>"
  },
  "features": {
    "voiceAssistant": true,
    "blog": false
  }
}
```

Edit markdown content:

```bash
vim content/pages/home.md
vim content/pages/contact.md
```

### 4. Setup Environment Variables

```bash
# Interactive setup
./scripts/setup-client.sh acme-fire

# Or copy template manually
cp .env.template .env
# Edit .env with API keys
```

### 5. Test Locally

```bash
npm run dev
```

Visit http://localhost:4321

### 6. Deploy to Railway

```bash
# First deployment
railway init
railway link

# Deploy
./scripts/deploy-client.sh acme-fire
```

## 🔄 Workflow: Adding New Clients

### Option A: Full Setup Script (Recommended)

```bash
# 1. Create client config
./scripts/setup-client.sh client-name

# 2. Initialize content
./scripts/init-content.sh client-name

# 3. Customize content
vim site-config.json
vim content/pages/contact.md

# 4. Test locally
cp configs/client-name.env .env
npm run dev

# 5. Deploy
./scripts/deploy-client.sh client-name
```

### Option B: Manual Setup

```bash
# 1. Copy templates
cp site-config.json.example site-config.json
cp -r content.example/ content/
cp .env.template .env

# 2. Edit all files
vim site-config.json
vim content/pages/*.md
vim .env

# 3. Test and deploy
npm run dev
railway up
```

## 📝 Common Customizations

### Change Page Title

```markdown
<!-- content/pages/contact.md -->
---
title: "Get in Touch"
hero:
  title: "Contact Our Team"
  subtitle: "We're here to help"
---
```

### Change Contact Form

```markdown
<!-- content/pages/contact.md -->
---
formUrl: "https://forms.client.com/contact"
showForm: true
---
```

### Disable a Feature

```json
// site-config.json
{
  "features": {
    "voiceAssistant": false,
    "blog": false,
    "pricing": true
  }
}
```

### Customize Navigation

```json
// site-config.json
{
  "navigation": {
    "main": [
      { "label": "Home", "href": "/" },
      { "label": "Services", "href": "/services" },
      { "label": "Contact", "href": "/contact" }
    ]
  }
}
```

### Change Brand Colors

```json
// site-config.json
{
  "branding": {
    "primaryColor": "#FF5733",
    "secondaryColor": "#0ea5e9"
  }
}
```

## 🔄 Updating Clients

### Push Core Updates (Code Changes)

When you fix bugs or add features:

```bash
# Commit to main repo
git add .
git commit -m "feat: add new dashboard widget"
git push

# Deploy to all clients
./scripts/update-all-clients.sh
```

**Result:** All clients get the new code, but keep their unique branding/content!

### Update Single Client Content

When a client wants content changes:

```bash
# 1. Copy their config locally
railway variables get > .env  # or use saved config
cp configs/client-a.env .env

# 2. Make sure content is current
./scripts/init-content.sh  # if needed

# 3. Edit content
vim content/pages/contact.md

# 4. Test
npm run dev

# 5. Deploy just that client
railway up --project client-a
```

## 📂 File Structure

```
astro-supabase-main/
├── src/                    # ✅ IN GIT - Shared code
│   ├── components/
│   ├── pages/
│   ├── lib/
│   │   └── content.ts      # NEW - Content system
│   └── ...
│
├── content/                # ❌ GITIGNORED - Client content
│   ├── pages/
│   │   ├── home.md
│   │   ├── contact.md
│   │   └── about.md
│   └── README.md           # ✅ IN GIT - Documentation only
│
├── configs/                # ❌ GITIGNORED - Client configs
│   ├── client-a.env
│   ├── client-b.env
│   └── README.md           # ✅ IN GIT - Documentation only
│
├── site-config.json        # ❌ GITIGNORED - Client settings
├── site-config.json.example # ✅ IN GIT - Template
│
├── .env                    # ❌ GITIGNORED - Current client
├── .env.template           # ✅ IN GIT - Template
│
└── scripts/                # ✅ IN GIT - Deployment tools
    ├── init-content.sh     # Initialize content directory
    ├── setup-client.sh     # Create client config
    ├── deploy-client.sh    # Deploy to Railway
    └── update-all-clients.sh # Update all deployments
```

## 🔐 Security & Backups

### What to Backup

Since content is gitignored, back it up separately:

```bash
# Backup client content
tar -czf backup-client-a-$(date +%Y%m%d).tar.gz \
  content/ \
  site-config.json \
  configs/client-a.env

# Encrypt backup
gpg -c backup-client-a-*.tar.gz

# Store in secure location (S3, 1Password, etc.)
```

### Railway Volumes (Coming Soon)

Railway supports volumes for persistent storage. Future enhancement:

```json
// railway.json
{
  "volumes": {
    "content": {
      "mountPath": "/app/content"
    }
  }
}
```

## 🧪 Testing

### Test Content System

```bash
# Test content loading
npm run dev

# Check console for:
# ✅ [CONTENT] Loaded page: contact
# ✅ [CONTENT] Site config loaded
```

### Test Different Clients Locally

```bash
# Test client A
cp configs/client-a.env .env
cp content-backups/client-a/* content/
npm run dev

# Test client B
cp configs/client-b.env .env  
cp content-backups/client-b/* content/
npm run dev
```

## 🐛 Troubleshooting

### "Page content not found"

```bash
# Check if content directory exists
ls -la content/pages/

# Initialize if missing
./scripts/init-content.sh
```

### "Cannot read site-config.json"

```bash
# Check if config exists
ls -la site-config.json

# Copy from example
cp site-config.json.example site-config.json
```

### "Gray-matter not found"

```bash
# Install dependency
npm install gray-matter
```

### Content not updating

```bash
# Clear Astro cache
rm -rf .astro dist
npm run dev
```

## 🎯 Next Steps

1. **Read full documentation:**
   - [Deployment Strategy](./MULTI_SITE_DEPLOYMENT_STRATEGY.md)
   - [CMS Analysis](./DEPLOYMENT_CMS_ANALYSIS.md)
   - [Client Branding Guide](./CLIENT_BRANDING_GUIDE.md)

2. **Set up your first client:**
   ```bash
   ./scripts/setup-client.sh my-first-client
   ./scripts/init-content.sh
   npm run dev
   ```

3. **Deploy to Railway:**
   ```bash
   ./scripts/deploy-client.sh my-first-client
   ```

4. **Add more clients:**
   - Repeat the process for each client
   - Each gets their own content/config
   - All share the same codebase

## 💡 Pro Tips

1. **Keep a template:** Maintain a "template client" with good default content
2. **Document customizations:** Keep notes on what's custom per client
3. **Test locally first:** Always test with client config before deploying
4. **Backup regularly:** Content is gitignored, so back it up separately
5. **Use Railway environments:** Staging environment for testing updates

## 📞 Need Help?

- Check [DEPLOYMENT_CMS_ANALYSIS.md](./DEPLOYMENT_CMS_ANALYSIS.md) for system design
- See [CLIENT_BRANDING_GUIDE.md](./CLIENT_BRANDING_GUIDE.md) for branding tips
- Review scripts in `/scripts/` directory

---

**You're now ready to deploy to multiple clients!** 🚀

