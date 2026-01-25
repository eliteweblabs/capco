# CMS Slug Sanitization Fix

## Problem

CMS pages were not displaying content when the slug had a leading slash (e.g., `/privacy` instead of `privacy`). This caused the page to exist in the database but not be found when routing.

## Root Cause

The slug field in the CMS allowed users to enter slugs with leading or trailing slashes (e.g., `/privacy/`), but the routing system expects clean slugs without slashes (e.g., `privacy`).

## Solution Implemented

### 1. Frontend Sanitization (Real-time)

Added real-time slug sanitization in the CMS form that strips leading/trailing slashes as the user types:

```javascript
// src/pages/admin/cms.astro
slugInput.addEventListener("input", (e) => {
  const sanitized = input.value.replace(/^\/+|\/+$/g, "");
  if (sanitized !== input.value) {
    input.value = sanitized;
  }
});
```

### 2. Form Submission Sanitization

Added slug sanitization before form submission to ensure clean data:

```javascript
// src/pages/admin/cms.astro (form submit handler)
const slug = slugInput?.value?.trim().replace(/^\/+|\/+$/g, "") || "";
```

### 3. API Sanitization

Added server-side slug sanitization in the API endpoint as a final safeguard:

```typescript
// src/pages/api/cms/pages.ts
if (slug) {
  slug = slug.trim().replace(/^\/+|\/+$/g, "");
}
```

### 4. User Guidance

- Updated placeholder text: `"about (no leading or trailing slashes)"`
- Added help text: "URL path without slashes (e.g., 'about' for /about, 'privacy' for /privacy)"

## Fixing Existing Data

Run this SQL script to fix any existing pages with problematic slugs:

```sql
-- sql-queriers/fix-cms-page-slugs.sql
UPDATE "cmsPages"
SET slug = TRIM(BOTH '/' FROM slug)
WHERE slug LIKE '/%' OR slug LIKE '%/';
```

## Best Practices

### Good Slugs ✓

- `privacy`
- `about`
- `terms`
- `contact`

### Bad Slugs ✗

- `/privacy` (leading slash)
- `privacy/` (trailing slash)
- `/privacy/` (both)

## Testing

1. Create a new page with slug `/test`
2. Observe that it's automatically sanitized to `test`
3. Save the page
4. Navigate to `/test` and verify content displays correctly

## Related Files

- `src/pages/admin/cms.astro` - CMS admin interface with form sanitization
- `src/pages/api/cms/pages.ts` - API endpoint with server-side sanitization
- `src/lib/content.ts` - Content loading logic (already correct with camelCase)
- `sql-queriers/fix-cms-page-slugs.sql` - Fix script for existing data
