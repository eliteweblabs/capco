# Fix CAPCo Auth Project Environment Variables

## Issue Found

Your `.env` file has an extra `@` symbol in `CMS_PG_HOST`:
- ❌ `CMS_PG_HOST=@db.qudlxlryegnainztkrtk.supabase.co`
- ✅ `CMS_PG_HOST=db.qudlxlryegnainztkrtk.supabase.co`

## Correct Configuration for CAPCo Auth Project

```bash
# PostgreSQL Connection (CAPCo Auth Project)
CMS_PG_DATABASE=postgres
CMS_PG_USER=postgres
CMS_PG_PASSWORD=vutHyw-sicvy6-ziwveg
CMS_PG_HOST=db.qudlxlryegnainztkrtk.supabase.co
CMS_PG_PORT=5432

# Encryption Key
CMS_ENCRYPTION_KEY=cc1b4e812f1271abe85e6fbf7307208be78f4a7bba667fe701c339b5974249db
```

## Quick Fix

In your `.env` file, change:
```bash
CMS_PG_HOST=@db.qudlxlryegnainztkrtk.supabase.co
```

To:
```bash
CMS_PG_HOST=db.qudlxlryegnainztkrtk.supabase.co
```

**Just remove the `@` symbol at the beginning!**

## After Fixing

Run migrations:
```bash
npx studiocms migrate --latest
```

Then start dev server:
```bash
npm run dev
```

