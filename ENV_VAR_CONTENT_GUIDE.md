# Content Management via Environment Variables

## Simple Solution - No Database Required

Manage per-deployment content using Railway environment variables. Works on all Railway plans, no Supabase needed.

## How It Works

Content loading priority:
1. **Environment Variables** (highest priority) - Per-deployment customization
2. **Git Files** - Default/template content
3. **Code Defaults** - Hardcoded fallbacks

## Setup

### Option 1: Simple Markdown Content

Set individual environment variables in Railway:

```bash
# Home page content
PAGE_HOME_CONTENT="# Welcome\n\nYour custom home page content here..."
PAGE_HOME_TITLE="Custom Home Page"
PAGE_HOME_DESCRIPTION="Custom description"

# Contact page content
PAGE_CONTACT_CONTENT="# Contact Us\n\nGet in touch..."
PAGE_CONTACT_TITLE="Contact"
```

### Option 2: JSON Format (Recommended)

Store complete page data as JSON:

```bash
PAGE_HOME_JSON='{"title":"Welcome","description":"Home page","content":"# Welcome\n\nContent...","template":"fullwidth"}'
```

## Usage Examples

### Example 1: Customize Home Page

In Railway Dashboard → Variables:

**Variable:** `PAGE_HOME_JSON`

**Value:**
```json
{
  "title": "Client A - Fire Protection Services",
  "description": "Professional fire protection for Client A",
  "template": "fullwidth",
  "content": "# Welcome to Client A\n\nWe provide expert fire protection services..."
}
```

### Example 2: Simple Text Override

**Variable:** `PAGE_HOME_CONTENT`

**Value:**
```
# Welcome

This is custom content for this deployment.
```

**Variable:** `PAGE_HOME_TITLE`

**Value:**
```
Custom Home Page Title
```

## Environment Variable Naming

Convert page slug to variable name:
- `home` → `PAGE_HOME_*`
- `contact` → `PAGE_CONTACT_*`
- `about-us` → `PAGE_ABOUT_US_*`
- `privacy-policy` → `PAGE_PRIVACY_POLICY_*`

### Available Variables

For each page slug (e.g., `home`):

- `PAGE_HOME_JSON` - Complete page as JSON (recommended)
- `PAGE_HOME_CONTENT` - Markdown content only
- `PAGE_HOME_TITLE` - Page title
- `PAGE_HOME_DESCRIPTION` - Page description
- `PAGE_HOME_TEMPLATE` - Template name (default, fullwidth, minimal)

## Setting Variables in Railway

### Via Dashboard

1. Go to Railway Dashboard → Your Service → Variables
2. Click "New Variable"
3. Add variable name (e.g., `PAGE_HOME_JSON`)
4. Paste value
5. Save (auto-redeploys)

### Via CLI

```bash
railway variables set PAGE_HOME_JSON='{"title":"Home","content":"# Welcome"}'
```

### Via railway.json

```json
{
  "services": [{
    "name": "astro-app",
    "environment": {
      "PAGE_HOME_JSON": "{\"title\":\"Home\",\"content\":\"# Welcome\"}"
    }
  }]
}
```

## Multi-Deployment Setup

### Deployment A (client-a.railway.app)

```bash
PAGE_HOME_JSON='{"title":"Client A","content":"# Client A Content"}'
RAILWAY_PROJECT_NAME="client-a"
```

### Deployment B (client-b.railway.app)

```bash
PAGE_HOME_JSON='{"title":"Client B","content":"# Client B Content"}'
RAILWAY_PROJECT_NAME="client-b"
```

Each deployment has unique content via environment variables!

## JSON Format Reference

```json
{
  "title": "Page Title",
  "description": "Page description for SEO",
  "template": "default|fullwidth|minimal",
  "content": "# Markdown Content\n\nYour markdown here...",
  "hero": {
    "title": "Hero Title",
    "subtitle": "Hero Subtitle",
    "cta": {
      "text": "Button Text",
      "href": "/link"
    }
  },
  "customField": "Any custom field"
}
```

## Limitations

- ⚠️ Environment variable size limit (~32KB per variable)
- ⚠️ Not ideal for very large markdown files
- ⚠️ Requires redeploy to change (unless using Railway's variable updates)

## Workarounds for Large Content

### Option 1: Split Content

Break large pages into sections:

```bash
PAGE_HOME_CONTENT_PART1="# Section 1\n\n..."
PAGE_HOME_CONTENT_PART2="# Section 2\n\n..."
```

Then combine in code (not implemented by default).

### Option 2: Use Git Files

For large content, keep it in git files and only override small parts via env vars.

### Option 3: External Storage

For very large content, use S3/R2 and load via API (requires additional setup).

## Testing Locally

```bash
# Set environment variable
export PAGE_HOME_JSON='{"title":"Test","content":"# Test"}'

# Run dev server
npm run dev

# Visit http://localhost:4321
# Should see your custom content
```

## Migration from Database

If you were using Supabase CMS:

1. Export content from database
2. Convert to JSON format
3. Set as `PAGE_{SLUG}_JSON` in Railway
4. Remove Supabase dependency

## Best Practices

1. **Use JSON format** - More flexible, easier to manage
2. **Keep defaults in git** - Only override what's different
3. **Document customizations** - Note which pages are customized per deployment
4. **Test locally first** - Set env vars locally before deploying
5. **Version control** - Keep a record of custom content in separate repo/docs

## Troubleshooting

### Content not updating?

1. Check variable name matches slug (uppercase, underscores)
2. Verify JSON is valid (use JSON validator)
3. Clear cache: Restart Railway deployment
4. Check logs for content loading messages

### Variable too large?

- Split into multiple variables
- Use git files for large content
- Consider external storage

### Want to revert?

Just delete the environment variable - system falls back to git files automatically.

