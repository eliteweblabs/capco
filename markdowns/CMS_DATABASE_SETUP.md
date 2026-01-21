# CMS Database Setup - Per-Deployment Content Management

## Problem Solved

**How to have different content for different Railway deployments when everything is deployed from git?**

✅ **Solution:** Store content in Supabase database, allowing each deployment to have unique content without git commits or SSH access.

## How It Works

### Content Priority Order

1. **Database (Supabase)** - Per-deployment content (highest priority)
2. **Files (Git)** - Default/template content
3. **Code Defaults** - Hardcoded fallbacks

### Benefits

- ✅ **No SSH required** - Manage content via API or Supabase dashboard
- ✅ **Per-deployment customization** - Each Railway deployment can have unique content
- ✅ **Version controlled defaults** - Git still contains template content
- ✅ **Easy updates** - Change content without redeploying code
- ✅ **Admin interface** - Use Supabase dashboard or build custom admin

## Setup Steps

### 1. Create Database Table

Run the SQL migration in your Supabase dashboard:

```bash
# Copy the SQL file
cat sql-queriers/create-cms-pages-table.sql
```

Or go to Supabase Dashboard → SQL Editor → Paste and run the SQL.

### 2. Verify Table Created

Check that `cmsPages` table exists:
- Supabase Dashboard → Table Editor → `cmsPages`

### 3. Test the API

The API is available at `/api/cms/pages`

**Get all pages:**
```bash
curl https://your-site.railway.app/api/cms/pages
```

**Get specific page:**
```bash
curl https://your-site.railway.app/api/cms/pages?slug=home
```

**Create/Update page:**
```bash
curl -X POST https://your-site.railway.app/api/cms/pages \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "home",
    "title": "Welcome to My Site",
    "description": "Custom home page",
    "content": "# Welcome\n\nThis is custom content for this deployment.",
    "template": "fullwidth"
  }'
```

## Usage Examples

### Example 1: Customize Home Page for Deployment A

```bash
# Deployment A (client-a.railway.app)
curl -X POST https://client-a.railway.app/api/cms/pages \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "home",
    "title": "Client A - Fire Protection",
    "content": "# Welcome to Client A\n\nCustom content here...",
    "template": "fullwidth"
  }'
```

### Example 2: Customize Contact Page for Deployment B

```bash
# Deployment B (client-b.railway.app)
curl -X POST https://client-b.railway.app/api/cms/pages \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "contact",
    "title": "Contact Client B",
    "content": "# Get in Touch\n\nDifferent contact info...",
    "frontmatter": {
      "formUrl": "https://different-form.com"
    }
  }'
```

### Example 3: Use Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor → `cmsPages`
2. Click "Insert row"
3. Fill in:
   - `slug`: "home"
   - `title`: "My Custom Home"
   - `content`: "# Welcome\n\nMarkdown content..."
   - `client_id`: (leave null for global, or set to `RAILWAY_PROJECT_NAME`)
   - `is_active`: true
4. Save

## How Content is Loaded

The `getPageContent()` function in `src/lib/content.ts` now:

1. **Checks database first** - Looks for `cmsPages` row matching slug + client_id
2. **Falls back to files** - Reads from `content/pages/*.md` if no database entry
3. **Uses defaults** - Hardcoded defaults if neither exists

### Client ID Logic

- If `client_id` is `null` → Global content (all deployments)
- If `client_id` matches `RAILWAY_PROJECT_NAME` → Deployment-specific content
- Client-specific content takes priority over global content

## Managing Content

### Option 1: Via API (Programmatic)

```typescript
// Create/update page
const response = await fetch('/api/cms/pages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slug: 'home',
    title: 'New Title',
    content: '# New Content',
  }),
});
```

### Option 2: Via Supabase Dashboard

1. Navigate to Table Editor
2. Select `cmsPages` table
3. Insert/Edit rows directly
4. Changes are live immediately (no redeploy needed)

### Option 3: Build Admin Interface

Create an admin page at `/admin/cms` that uses the API to manage content.

## Migration Strategy

### For Existing Deployments

1. **Keep git content** - Default files stay in git as templates
2. **Add database content** - Override specific pages via database
3. **Gradual migration** - Move pages to database as needed

### For New Deployments

1. **Deploy from git** - Gets default content files
2. **Customize via database** - Override pages as needed
3. **No git commits needed** - All customization in database

## Example: Multi-Client Setup

```
┌─────────────────────────────────────────┐
│  Git Repository (Shared Code)          │
│  - content/pages/home.md (template)    │
│  - content/pages/contact.md (template) │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                         │
┌───────────────┐      ┌───────────────┐
│ Deployment A  │      │ Deployment B  │
│               │      │               │
│ Supabase DB:  │      │ Supabase DB:  │
│ - home (A)    │      │ - home (B)    │
│ - contact (A) │      │ - contact (B) │
└───────────────┘      └───────────────┘
```

Each deployment:
- Uses same code from git
- Has unique content in database
- Falls back to git files if no DB entry
- No SSH or manual file uploads needed

## Security Notes

- ✅ RLS policies allow public read access to active pages
- ✅ Write access requires service role key (server-side only)
- ✅ Client-specific content isolated by `client_id`
- ⚠️ Consider adding admin authentication for write operations

## Troubleshooting

### Content not updating?

1. Check `is_active` is `true` in database
2. Clear cache: Restart Railway deployment
3. Verify `client_id` matches `RAILWAY_PROJECT_NAME`
4. Check database connection: Verify `SUPABASE_SECRET` is set

### Database not found?

1. Run the SQL migration: `sql-queriers/create-cms-pages-table.sql`
2. Verify table exists in Supabase dashboard
3. Check `supabaseAdmin` is configured in `src/lib/supabase-admin.ts`

### Want to revert to file-based?

Just delete the database row - system will fall back to files automatically.

