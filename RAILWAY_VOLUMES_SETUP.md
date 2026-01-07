# Railway Volumes Setup - Persistent Content Storage

## Problem

When deploying from GitHub, Railway overwrites the entire filesystem, including custom markdown files.

## Solution: Railway Volumes

Railway Volumes provide **persistent storage** that survives deployments. Content files stored in volumes won't be overwritten.

## Setup Steps

### Step 1: Create Volume in Railway

1. Go to Railway Dashboard → Your Service
2. Click **"Volumes"** tab
3. Click **"New Volume"**
4. Configure:
   - **Name**: `content-storage`
   - **Mount Path**: `/app/content-persistent`
   - **Size**: 1GB (or as needed)

### Step 2: Update Dockerfile

Mount the volume and copy content if it doesn't exist:

```dockerfile
# After COPY . . but before build
# Ensure persistent content directory exists
RUN mkdir -p /app/content-persistent/pages

# Copy default content to volume if it doesn't exist (first deploy only)
RUN if [ ! -f "/app/content-persistent/pages/home.md" ]; then \
  echo "Copying default content to persistent volume..." && \
  cp -r content/pages/*.md /app/content-persistent/pages/ 2>/dev/null || \
  (mkdir -p /app/content-persistent/pages && \
   ./scripts/init-content.sh default || true); \
  fi

# Create symlink so content.ts can find it
RUN ln -sf /app/content-persistent /app/content-persistent-link
```

### Step 3: Update content.ts

Check persistent volume first, then git files:

```typescript
export async function getPageContent(slug: string): Promise<PageContent | null> {
  // ... existing env var checks ...

  // Check persistent volume first (survives deployments)
  const persistentPath = "/app/content-persistent/pages";
  const persistentFilePath = join(persistentPath, `${slug}.md`);
  
  if (existsSync(persistentFilePath)) {
    try {
      const fileContent = readFileSync(persistentFilePath, "utf-8");
      const { data, content } = matter(fileContent);
      const pageContent: PageContent = {
        ...data,
        content,
        title: data.title || "Untitled Page",
      };
      cache.set(cacheKey, pageContent);
      console.log(`✅ [CONTENT] Loaded ${slug} from persistent volume`);
      return pageContent;
    } catch (error) {
      console.warn(`⚠️ [CONTENT] Error reading from volume:`, error);
    }
  }

  // Then check git files (existing logic)
  const contentPath = join(process.cwd(), "content", "pages", `${slug}.md`);
  // ... rest of existing code ...
}
```

### Step 4: Update railway.json (Optional)

You can also configure volumes in `railway.json`:

```json
{
  "services": [{
    "name": "astro-app",
    "volumes": [
      {
        "name": "content-storage",
        "mountPath": "/app/content-persistent"
      }
    ]
  }]
}
```

## How It Works

### First Deployment

1. Volume is empty
2. Dockerfile copies default content from git to volume
3. Content is stored in persistent volume

### Subsequent Deployments

1. Git code is deployed (overwrites `/app`)
2. Volume persists (not overwritten)
3. Custom content files remain in `/app/content-persistent`
4. System uses volume content (custom) instead of git files (defaults)

### Editing Content

**Option 1: Via Railway SSH**

```bash
# Connect to Railway service
railway shell

# Edit content file
nano /app/content-persistent/pages/home.md

# Save and exit
# Changes are live immediately (no redeploy needed!)
```

**Option 2: Via API Endpoint**

Create an API endpoint to update files:

```typescript
// src/pages/api/content/update.ts
export const POST: APIRoute = async ({ request }) => {
  const { slug, content } = await request.json();
  const filePath = `/app/content-persistent/pages/${slug}.md`;
  
  // Write to volume
  writeFileSync(filePath, content, "utf-8");
  
  return new Response(JSON.stringify({ success: true }));
};
```

**Option 3: Via Supabase Dashboard**

If you have Supabase, you can still use the database approach, but volumes are simpler.

## Benefits

- ✅ **Persistent** - Content survives deployments
- ✅ **No overwrites** - Git deployments don't touch volume
- ✅ **Easy editing** - SSH in and edit files directly
- ✅ **No database needed** - Simple file-based storage
- ✅ **Version control** - Can backup volume contents

## Limitations

- ⚠️ **Railway Pro required** - Volumes are a paid feature
- ⚠️ **Manual management** - Need to SSH or use API to edit
- ⚠️ **No git history** - Changes aren't version controlled (unless you backup)

## Alternative: Hybrid Approach

Use volumes for custom content, git for defaults:

1. **Git files** (`content/pages/*.md`) - Default/template content
2. **Volume files** (`/app/content-persistent/pages/*.md`) - Custom overrides
3. **Priority**: Volume > Git > Defaults

This way:
- Default content is version controlled (git)
- Custom content persists (volume)
- Best of both worlds

## Backup Strategy

Since volume content isn't in git, back it up:

```bash
# Backup volume content
railway shell
tar -czf content-backup-$(date +%Y%m%d).tar.gz /app/content-persistent

# Or sync to git repo periodically
git init content-backup-repo
cp -r /app/content-persistent/* content-backup-repo/
cd content-backup-repo
git add .
git commit -m "Backup content from Railway"
```

## Migration Path

1. **Start with git files** - Default content in repository
2. **Deploy to Railway** - Gets default content
3. **Customize via volume** - Edit files in persistent volume
4. **Future deployments** - Keep customizations, update code

## Troubleshooting

### Volume not mounting?

- Check volume exists in Railway dashboard
- Verify mount path matches Dockerfile
- Check service has volume attached

### Content not persisting?

- Verify files are in `/app/content-persistent` not `/app/content`
- Check volume is attached to service
- Ensure volume has correct permissions

### Want to reset?

Delete volume and recreate - will copy defaults again on next deploy.
