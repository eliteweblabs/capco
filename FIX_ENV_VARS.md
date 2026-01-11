# Fix Your .env File

## Current Issues Found

1. ❌ **Extra @ symbol**: `CMS_PG_HOST=@db.qudlxlryegnainztkrtk.supabase.co`
2. ❌ **Wrong project**: Using CAPCo Auth (`qudlxlryegnainztkrtk`) instead of Rothco (`fhqglhcjlkusrykqnoel`)

## Correct Values for Your .env File

```bash
# PostgreSQL Connection (Rothco Project)
CMS_PG_DATABASE=postgres
CMS_PG_USER=postgres
CMS_PG_HOST=db.fhqglhcjlkusrykqnoel.supabase.co
CMS_PG_PORT=5432
CMS_PG_PASSWORD=[GET-FROM-SUPABASE-DASHBOARD]

# Encryption Key
CMS_ENCRYPTION_KEY=cc1b4e812f1271abe85e6fbf7307208be78f4a7bba667fe701c339b5974249db
```

## Steps to Fix

1. **Open your `.env` file**

2. **Find and update `CMS_PG_HOST`**:
   - ❌ Remove: `CMS_PG_HOST=@db.qudlxlryegnainztkrtk.supabase.co`
   - ✅ Replace with: `CMS_PG_HOST=db.fhqglhcjlkusrykqnoel.supabase.co`
   - **Important**: Remove the `@` symbol at the beginning!

3. **Update `CMS_PG_PASSWORD`**:
   - Get the password for the **Rothco** project (not CAPCo Auth)
   - Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database
   - Reset password if needed
   - Copy and paste it

4. **Remove or comment out the old connection string** (if you have it):
   ```bash
   # CMS_POSTGRES_URL=postgresql://postgres:vutHyw-sicvy6-ziwveg@db.qudlxlryegnainztkrtk.supabase.co:5432/postgres
   ```

5. **Save the file**

6. **Run migrations again**:
   ```bash
   npx studiocms migrate --latest
   ```

## Quick Copy-Paste Fix

Replace your current CMS_PG_* variables with:

```bash
CMS_PG_DATABASE=postgres
CMS_PG_USER=postgres
CMS_PG_HOST=db.fhqglhcjlkusrykqnoel.supabase.co
CMS_PG_PORT=5432
CMS_PG_PASSWORD=[PASTE-ROTHCO-PASSWORD-HERE]
CMS_ENCRYPTION_KEY=cc1b4e812f1271abe85e6fbf7307208be78f4a7bba667fe701c339b5974249db
```

