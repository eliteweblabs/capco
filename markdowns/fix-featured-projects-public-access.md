# Fix: Featured Projects Public Access

## Problem

Featured projects were only showing when logged in, but not when viewing the site as a guest (not authenticated). This was happening due to two issues:

1. **API Required Authentication**: The `/api/projects/get?featured=true` endpoint required authentication for ALL requests, even for featured projects that should be publicly visible
2. **Storage RLS Policies**: The `project-media` bucket required authentication to view ANY files, including featured images

## Root Cause

### Issue 1: API Authentication Check
In `src/pages/api/projects/get.ts`, the authentication check was happening at the very beginning, before checking if the request was for featured projects:

```typescript
// OLD CODE - Always required auth
const { isAuth, currentUser } = await checkAuth(cookies);
if (!isAuth || !currentUser) {
  return new Response(JSON.stringify({ error: "Authentication required" }), {
    status: 401,
  });
}
```

### Issue 2: Storage Bucket Policies
The `project-media` bucket had RLS policies that only allowed authenticated users to view files:

```sql
CREATE POLICY "project_media_download" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-media' AND
  auth.role() = 'authenticated'  -- ❌ Required auth for ALL files
);
```

## Solution

### Fix 1: Allow Public Access to Featured Projects API

Modified `src/pages/api/projects/get.ts` to:
1. Parse query parameters first
2. Check if request is for featured projects (`featured=true`)
3. Skip authentication check ONLY for featured project requests
4. Skip role-based filtering for featured project requests

```typescript
// NEW CODE - Check if featured request first
const featured = url.searchParams.get("featured");
const isFeaturedRequest = featured === "true";

// Check authentication (skip for featured projects)
const { isAuth, currentUser } = await checkAuth(cookies);
if (!isFeaturedRequest && (!isAuth || !currentUser)) {
  return new Response(JSON.stringify({ error: "Authentication required" }), {
    status: 401,
  });
}

// Later in code...
// Apply role-based filtering (skip for featured projects)
if (!isFeaturedRequest && currentUser) {
  const userRole = currentUser.profile?.role;
  if (userRole === "Client") {
    query = query.eq("authorId", currentUser.id);
  }
}
```

### Fix 2: Allow Public Access to Featured Images

Added a new storage policy to allow public read access to all files in the `project-media` bucket:

```sql
CREATE POLICY "project_media_public_read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-media'
);
```

**Why allow ALL files?**
- Featured images can have any path structure (e.g., `{projectId}/{filename}`, not necessarily "featured-*")
- The `publicUrl` in `featuredImageData` already uses the public path format
- Upload/Update/Delete operations still require authentication (only SELECT/read is public)
- This matches the intent: if a project is marked as featured, its image should be publicly viewable

**Security Notes:**
- ✅ Only SELECT (read) operations are public
- ✅ INSERT (upload) still requires authentication
- ✅ UPDATE still requires authentication  
- ✅ DELETE still requires authentication
- ⚠️ All files in `project-media` bucket are now publicly readable (by URL)
- ⚠️ Do not upload sensitive files to `project-media` bucket

## Files Changed

1. **src/pages/api/projects/get.ts** - Modified authentication logic to allow public access for featured projects
2. **sql-queriers/fix-featured-images-public-access.sql** - New SQL script to add public read policy for featured images

## Testing

To verify the fix works:

1. **As a logged-out user**, navigate to the featured projects section
2. Verify that:
   - Featured projects list is visible
   - Featured project images load correctly
   - No authentication errors appear in console

3. **As a logged-in user**, verify:
   - Featured projects still work
   - All other authenticated functionality still works
   - Non-featured projects still require authentication

## Security Considerations

✅ **Safe Changes**:
- Only featured projects marked with `featured: true` are publicly accessible via API
- Only SELECT (read) operations are public for storage - uploads/updates/deletes still require auth
- All other projects and their data still require authentication
- Role-based access control still applies to non-featured content

⚠️ **Important Notes**:
- All files in the `project-media` bucket are now publicly readable (by direct URL)
- Do NOT upload sensitive files to the `project-media` bucket
- If you need private project files, use a different bucket with auth-only policies
- Featured images are intentionally public to enable marketing/showcase use cases
- If a project is marked as featured, its basic info (title, address, description, etc.) becomes public

## Related Components

These components display featured projects and will now work for non-authenticated users:

- `src/components/common/FeaturedProjects.astro` - Main featured projects component
- Any page that imports and uses FeaturedProjects component

## Database Schema

The `projects` table includes these relevant fields:
- `featured` (boolean) - Marks a project as featured (publicly visible)
- `featuredImageId` (int) - References the featured image file
- `featuredImageData` (jsonb) - Denormalized data with `publicUrl` for the featured image

The database trigger automatically populates `featuredImageData` when `featuredImageId` is set.

## Migration Applied

Date: January 23, 2026
Environment: Production (via Supabase MCP)
Status: ✅ Successfully applied

The storage policy was created and verified in the production database.
