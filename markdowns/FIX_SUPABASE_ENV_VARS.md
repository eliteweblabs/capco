# Fix Supabase Environment Variables

## Problem
Your `.env` file has incorrect Supabase keys that are preventing templates from being applied to new projects.

## Current State (INCORRECT)
```bash
PUBLIC_SUPABASE_URL=https://fhqglhcjlkusrykqnoel.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE=sb_publishable_JDVrN4h8miyYGeTIvZMQWw_dtKZHX5U  # Wrong key name
SUPABASE_SECRET=sb_secret_qA1kCkaVOq5Z-mmJCRhkZQ_txlOnf8u  # Invalid format
```

## Required State (CORRECT)
```bash
PUBLIC_SUPABASE_URL=https://fhqglhcjlkusrykqnoel.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Long JWT token
SUPABASE_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Long JWT token (service_role)
```

## How to Fix

### Step 1: Get Your Correct API Keys

1. Go to your Supabase project dashboard:
   **https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/api**

2. You'll see two keys:
   - **anon / public** - This is your `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** - This is your `SUPABASE_SECRET`

3. Both keys are LONG JWT tokens that start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`

### Step 2: Update Your Local .env File

Replace these lines in your `.env` file:

```bash
# ❌ REMOVE THESE:
# PUBLIC_SUPABASE_PUBLISHABLE=sb_publishable_JDVrN4h8miyYGeTIvZMQWw_dtKZHX5U
# SUPABASE_SECRET=sb_secret_qA1kCkaVOq5Z-mmJCRhkZQ_txlOnf8u

# ✅ ADD THESE (with your actual keys from Supabase dashboard):
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here...
SUPABASE_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_service_role_key_here...
```

### Step 3: Update Railway Environment Variables

1. Go to your Railway project settings
2. Add/update these environment variables:
   - `PUBLIC_SUPABASE_ANON_KEY` = (anon/public key from Supabase)
   - `SUPABASE_SECRET` = (service_role key from Supabase)
   - `PUBLIC_SUPABASE_URL` = https://fhqglhcjlkusrykqnoel.supabase.co

3. Redeploy your app on Railway

### Step 4: Verify It Works

Run the diagnostic script again:

```bash
node scripts/diagnose-templates.js 13
```

You should see:
- ✅ Table exists with templates
- ✅ Project found
- ✅ Templates applied (or ready to apply)

### Step 5: Apply Templates to Existing Project

If project 13 still doesn't have templates, run:

```bash
node scripts/apply-templates-to-project.js 13
```

## Why This Matters

Without the correct `SUPABASE_SECRET` (service_role key):
- `supabaseAdmin` in `src/lib/supabase-admin.ts` fails to initialize
- `applyProjectTemplates()` cannot insert punchlist/discussion items
- New projects are created WITHOUT default templates

## Testing

After fixing, create a new test project and verify it automatically gets:
- 1 punchlist item (based on your current templates)
- 3 discussion items (based on your current templates)

## Files Updated
- ✅ `src/pages/tests/ocr.astro` - Now uses environment variables instead of hardcoded old credentials
