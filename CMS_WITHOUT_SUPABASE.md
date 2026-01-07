# CMS Solutions Without Supabase

## Problem

Need per-deployment content management without Supabase database.

## Solution Options

### Option 1: Railway Volumes (Recommended)

**Best for:** File-based content that persists across deployments

Railway Volumes provide persistent storage that survives deployments.

#### Setup

1. **Create Volume in Railway:**
   - Railway Dashboard → Your Service → Volumes
   - Click "New Volume"
   - Name: `content-storage`
   - Mount Path: `/app/content`

2. **Update Dockerfile:**

```dockerfile
# Mount volume at /app/content
VOLUME ["/app/content"]

# Copy default content to volume if it doesn't exist
RUN if [ ! -f "/app/content/pages/home.md" ]; then \
  mkdir -p /app/content/pages && \
  cp -r content/pages/*.md /app/content/pages/ 2>/dev/null || true && \
  ./scripts/init-content.sh default || true; \
  fi
```

3. **Update content.ts to check volume first:**

```typescript
// Check volume path first, then git files
const volumePath = "/app/content/pages";
const gitPath = join(process.cwd(), "content", "pages");

const contentPath = existsSync(volumePath) 
  ? join(volumePath, `${slug}.md`)
  : join(gitPath, `${slug}.md`);
```

**Pros:**
- ✅ Persistent across deployments
- ✅ No database needed
- ✅ File-based (easy to edit)
- ✅ Can SSH and edit files directly

**Cons:**
- ⚠️ Requires Railway Pro plan (volumes are paid feature)
- ⚠️ Need to manage files manually or via SSH

---

### Option 2: Environment Variables (Simple Content)

**Best for:** Small content, simple text overrides

Store content as environment variables in Railway.

#### Implementation

1. **Update content.ts:**

```typescript
export async function getPageContent(slug: string): Promise<PageContent | null> {
  // 1. Check environment variable override
  const envKey = `PAGE_${slug.toUpperCase().replace(/-/g, '_')}`;
  const envContent = process.env[envKey];
  
  if (envContent) {
    try {
      const parsed = JSON.parse(envContent);
      return {
        title: parsed.title || slug,
        description: parsed.description || "",
        content: parsed.content || "",
        ...parsed,
      };
    } catch {
      // If not JSON, treat as markdown content
      return {
        title: process.env[`PAGE_${slug.toUpperCase()}_TITLE`] || slug,
        description: process.env[`PAGE_${slug.toUpperCase()}_DESCRIPTION`] || "",
        content: envContent,
      };
    }
  }

  // 2. Fall back to files (existing logic)
  // ...
}
```

2. **Set in Railway:**

```bash
# Simple markdown content
PAGE_HOME="# Welcome\n\nContent here..."

# Or JSON format
PAGE_HOME='{"title":"Home","content":"# Welcome\n\nContent"}'
```

**Pros:**
- ✅ Works on all Railway plans
- ✅ Easy to set via Railway dashboard
- ✅ No additional infrastructure

**Cons:**
- ⚠️ Limited by env var size (~32KB)
- ⚠️ Not ideal for large markdown files
- ⚠️ Hard to manage multiple pages

---

### Option 3: Build-Time Content Generation

**Best for:** Content that changes infrequently

Generate content files during build from environment variables or external source.

#### Implementation

1. **Create build script:**

```bash
#!/bin/bash
# scripts/generate-content.sh

mkdir -p content/pages

# Generate home.md from env vars
cat > content/pages/home.md <<EOF
---
title: "${PAGE_HOME_TITLE:-Welcome}"
description: "${PAGE_HOME_DESCRIPTION:-Default description}"
template: "${PAGE_HOME_TEMPLATE:-fullwidth}"
---

${PAGE_HOME_CONTENT:-# Welcome\n\nDefault content}
EOF

# Generate contact.md
cat > content/pages/contact.md <<EOF
---
title: "${PAGE_CONTACT_TITLE:-Contact Us}"
---

${PAGE_CONTACT_CONTENT:-# Contact\n\nContact info}
EOF
```

2. **Update Dockerfile:**

```dockerfile
# Generate content before build
RUN chmod +x scripts/generate-content.sh && \
    ./scripts/generate-content.sh

# Then build
RUN npm run build:railway
```

3. **Set variables in Railway:**
- `PAGE_HOME_TITLE`
- `PAGE_HOME_CONTENT`
- `PAGE_CONTACT_TITLE`
- etc.

**Pros:**
- ✅ Works on all plans
- ✅ Version controlled (in build)
- ✅ No runtime database needed

**Cons:**
- ⚠️ Requires redeploy to change content
- ⚠️ Many env vars needed for multiple pages

---

### Option 4: External File Storage (S3, etc.)

**Best for:** Large content, multiple deployments

Store content files in S3, Cloudflare R2, or similar.

#### Implementation

1. **Create content loader:**

```typescript
// src/lib/content-storage.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export async function getContentFromStorage(slug: string): Promise<string | null> {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.CONTENT_BUCKET!,
      Key: `content/pages/${slug}.md`,
    });
    
    const response = await s3.send(command);
    const content = await response.Body?.transformToString();
    return content || null;
  } catch {
    return null;
  }
}
```

2. **Update content.ts:**

```typescript
// 1. Check storage
const storageContent = await getContentFromStorage(slug);
if (storageContent) {
  // Parse and return
}

// 2. Fall back to files
// ...
```

**Pros:**
- ✅ Scalable
- ✅ Can update without redeploy
- ✅ Works with any storage provider

**Cons:**
- ⚠️ Requires storage service setup
- ⚠️ More complex
- ⚠️ Additional costs

---

### Option 5: Git Submodules or Separate Repos

**Best for:** Content that changes frequently, team collaboration

Store content in separate git repository.

#### Implementation

1. **Create content repository:**
```bash
git init content-repo
# Add markdown files
git commit -m "Initial content"
```

2. **Add as submodule:**
```bash
git submodule add https://github.com/your-org/content-repo.git content-custom
```

3. **Update content.ts to check custom content first:**

```typescript
const customPath = join(process.cwd(), "content-custom", "pages", `${slug}.md`);
const defaultPath = join(process.cwd(), "content", "pages", `${slug}.md`);

const contentPath = existsSync(customPath) ? customPath : defaultPath;
```

**Pros:**
- ✅ Version controlled
- ✅ Team collaboration
- ✅ Separate from code

**Cons:**
- ⚠️ Requires managing multiple repos
- ⚠️ Still need to deploy content repo

---

## Recommended: Option 1 (Railway Volumes) + Option 2 (Env Vars)

**Hybrid approach:**

1. **Use Railway Volumes** for full markdown files (if on Pro plan)
2. **Use Environment Variables** for simple overrides (works on all plans)
3. **Fall back to git files** as defaults

This gives you:
- ✅ Persistent storage (volumes)
- ✅ Quick overrides (env vars)
- ✅ Default templates (git)
- ✅ Works on free tier (env vars only)
- ✅ Full featured on Pro (volumes)

## Quick Implementation

### For Free Tier (Env Vars Only)

Update `content.ts` to check env vars first:

```typescript
// Check env var override
const envContent = process.env[`PAGE_${slug.toUpperCase()}_CONTENT`];
if (envContent) {
  return {
    title: process.env[`PAGE_${slug.toUpperCase()}_TITLE`] || slug,
    content: envContent,
    // ... parse markdown
  };
}
// Then check files...
```

### For Pro Tier (Add Volumes)

1. Create volume in Railway
2. Mount at `/app/content`
3. Update content.ts to check `/app/content` first

## Comparison

| Solution | Free Tier | Pro Tier | Update Without Deploy | Complexity |
|----------|-----------|----------|----------------------|------------|
| Env Vars | ✅ | ✅ | ✅ | Low |
| Volumes | ❌ | ✅ | ✅ | Medium |
| Build-time | ✅ | ✅ | ❌ | Low |
| External Storage | ✅ | ✅ | ✅ | High |
| Git Submodules | ✅ | ✅ | ❌ | Medium |

**Recommendation:** Start with **Environment Variables** (works everywhere), upgrade to **Volumes** if you need file-based editing.

