# Railway Environment Variables Fix

## Issue: "Supabase is not configured"

If you're seeing this error after setting `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` in Railway, here's how to fix it:

## Problem

In Astro, `PUBLIC_` prefixed environment variables are **embedded at build time**. If you:
1. Add the variables to Railway
2. But don't trigger a rebuild

The variables won't be available because the build already happened without them.

## Solution

### Step 1: Verify Variables in Railway

1. Go to Railway Dashboard
2. Select your project
3. Go to **Variables** tab
4. Verify these exist:
   ```
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (long string)
   ```

### Step 2: Force a Rebuild

**Option A: Manual Redeploy**
1. In Railway, go to your service
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or click **Trigger Deploy** button

**Option B: Push a Commit**
1. Make a small change (add a comment, update README)
2. Push to your main branch
3. Railway will automatically rebuild

**Option C: Delete and Re-add Variables**
1. Delete `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
2. Save
3. Add them back
4. Save (this should trigger a rebuild)

### Step 3: Verify Build Logs

During the rebuild, check the build logs:
1. Go to **Deployments** tab
2. Click on the deployment
3. Check the build logs for errors
4. Verify the variables are being read

### Step 4: Temporary Fallback (If Still Not Working)

If Railway still doesn't pick up the `PUBLIC_` variables, you can temporarily keep both sets:

**In Railway Variables:**
```bash
# Primary (for client-side)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Fallback (for server-side, until PUBLIC_ works)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

The code now has fallbacks, so it will use `PUBLIC_` if available, otherwise fall back to the non-PUBLIC versions.

## Why This Happens

- **Build Time vs Runtime**: Astro embeds `PUBLIC_` variables into the JavaScript bundle during build
- **Railway Build**: Railway builds your app when you deploy, not when you add variables
- **Solution**: You need to rebuild after adding `PUBLIC_` variables

## Verification

After redeploy, check:
1. Go to your site
2. Open browser console
3. Type: `import.meta.env.PUBLIC_SUPABASE_URL`
4. It should show your Supabase URL (not undefined)

## Common Mistakes

❌ **Adding variables but not rebuilding** - Variables won't be available
❌ **Only setting PUBLIC_ variables** - Server-side code might need fallbacks
❌ **Typo in variable name** - Must be exactly `PUBLIC_SUPABASE_URL` (case-sensitive)

✅ **Set both PUBLIC_ and non-PUBLIC** - Works for both client and server
✅ **Rebuild after adding variables** - Ensures they're embedded in build
✅ **Check build logs** - Verify variables are being read

