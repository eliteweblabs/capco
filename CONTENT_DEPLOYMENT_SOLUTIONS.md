# Content Management Solutions for Railway Deployments

## Problem

The `content/` directory is gitignored, which means:
- ❌ Railway deployments from GitHub don't include content files
- ❌ Each deployment needs manual content setup
- ❌ No way to version control content per client
- ❌ Content gets lost on redeployments

## Solution Options

### Option 1: Include Default Content in Git (Recommended)

**Best for:** Most deployments, simple setup

**Changes:**
1. Remove `content/` from `.gitignore` OR add exceptions for default files
2. Include template/default content files in git
3. Allow per-deployment customization via environment variables

**Pros:**
- ✅ Works immediately with Railway deployments
- ✅ Content is version controlled
- ✅ Easy to update across all deployments
- ✅ No additional infrastructure needed

**Cons:**
- ⚠️ All clients see same default content (can override via env vars)
- ⚠️ Less flexible for highly customized clients

**Implementation:**
```gitignore
# Client-specific content (unique per deployment)
content/
site-config.json

# But keep the default/template content
!content/pages/home.md
!content/pages/contact.md
!content/pages/privacy.md
!content/pages/terms.md
!content/pages/404.md
!content/README.md
!site-config.json.example
```

### Option 2: Generate Content During Build

**Best for:** When you want to keep content gitignored but auto-generate defaults

**Changes:**
1. Run `init-content.sh` in Dockerfile if content doesn't exist
2. Keep content gitignored
3. Content is created fresh on each deployment

**Pros:**
- ✅ Keeps content separate from code
- ✅ Auto-generates defaults
- ✅ Works with Railway

**Cons:**
- ⚠️ Content is lost on redeployments (unless stored elsewhere)
- ⚠️ Requires build-time script execution

**Implementation:**
Add to Dockerfile before build:
```dockerfile
# Generate default content if it doesn't exist
RUN if [ ! -d "content/pages" ]; then \
  mkdir -p content/pages && \
  ./scripts/init-content.sh default; \
  fi
```

### Option 3: Store Content in Supabase

**Best for:** Dynamic content, CMS-like functionality

**Changes:**
1. Create `cms_pages` table in Supabase
2. Modify `getPageContent()` to check database first, then files
3. Store markdown content in database

**Pros:**
- ✅ Content persists across deployments
- ✅ Can be edited via admin panel
- ✅ Per-client content in same database
- ✅ Version control via database

**Cons:**
- ⚠️ Requires database migration
- ⚠️ More complex implementation
- ⚠️ Need admin interface for editing

**Implementation:**
```sql
CREATE TABLE cms_pages (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT, -- markdown content
  frontmatter JSONB, -- frontmatter as JSON
  client_id TEXT, -- optional: for multi-client
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Option 4: Hybrid - Defaults in Git + Env Var Overrides

**Best for:** Maximum flexibility

**Changes:**
1. Include default content in git
2. Allow overrides via environment variables
3. Fallback chain: Env vars → Files → Hardcoded defaults

**Pros:**
- ✅ Works out of the box
- ✅ Can customize via Railway env vars
- ✅ No database needed
- ✅ Version controlled defaults

**Cons:**
- ⚠️ Env vars limited for large content
- ⚠️ Not ideal for rich markdown

## Recommended Solution: Option 1 + Option 4 Hybrid

**Include default content in git, allow env var overrides for simple text.**

### Step 1: Update `.gitignore`

```gitignore
# Client-specific content (unique per deployment)
content/
site-config.json

# But keep the default/template content files
!content/pages/*.md
!content/README.md
!site-config.json.example

# Allow client-specific overrides (these stay gitignored)
content/pages/*-custom.md
content/client-specific/
```

### Step 2: Update `content.ts` to support env var overrides

```typescript
export async function getPageContent(slug: string): Promise<PageContent | null> {
  // 1. Check environment variable override first
  const envKey = `PAGE_CONTENT_${slug.toUpperCase().replace(/-/g, '_')}`;
  if (process.env[envKey]) {
    try {
      return JSON.parse(process.env[envKey]);
    } catch (e) {
      console.warn(`Invalid JSON in ${envKey}`);
    }
  }

  // 2. Try to read markdown file (existing logic)
  const contentPath = join(process.cwd(), "content", "pages", `${slug}.md`);
  if (existsSync(contentPath)) {
    // ... existing file reading logic
  }

  // 3. Fallback to hardcoded defaults
  return getDefaultPageContent(slug);
}

function getDefaultPageContent(slug: string): PageContent | null {
  const defaults: Record<string, PageContent> = {
    home: {
      title: process.env.RAILWAY_PROJECT_NAME || "Fire Protection Services",
      description: process.env.GLOBAL_COMPANY_SLOGAN || "Professional fire protection plan review and approval",
      content: "# Welcome\n\nDefault home page content...",
    },
    // ... other defaults
  };
  return defaults[slug] || null;
}
```

### Step 3: Update Dockerfile to ensure content exists

```dockerfile
# Ensure content directory exists (will use git version or generate)
RUN if [ ! -f "content/pages/home.md" ]; then \
  mkdir -p content/pages && \
  ./scripts/init-content.sh default || true; \
  fi
```

## Quick Fix for Current Deployment

**Immediate solution:** Update `.gitignore` to include default content files:

```gitignore
# Client-specific content (unique per deployment)  
content/
site-config.json

# But keep the default/template content
!content/pages/home.md
!content/pages/contact.md
!content/pages/privacy.md
!content/pages/terms.md
!content/pages/404.md
!content/README.md
!site-config.json.example
```

Then commit the existing content files:
```bash
git add -f content/pages/*.md
git commit -m "Add default content files for Railway deployments"
git push
```

This will make content available in Railway deployments immediately.

