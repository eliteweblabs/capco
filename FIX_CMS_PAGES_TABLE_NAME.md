# Fix CMS Pages Table Name Issue

## The Problem

After renaming `cmsPages` to `cmsPages`, everything is missing because PostgreSQL table names are **case-sensitive when quoted**:

- `cmsPages` → treated as lowercase `cmsPages`
- `cmsPages` (unquoted) → PostgreSQL converts to `cmspages` (all lowercase!)
- `"cmsPages"` (quoted) → PostgreSQL preserves as `cmsPages` (exact case)

Your code references the table as `"cmsPages"` (with quotes) but the actual table in the database is likely still `cmsPages` OR was created as `cmspages` (lowercase).

## Quick Diagnosis

Run this in your Supabase SQL Editor to see what tables exist:

```sql
-- Check what CMS-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name ILIKE '%cms%page%';
```

## Solution Options

### Option 1: Keep Original Name (Recommended - Easiest)

Revert to using `cmsPages` (snake_case) which is the PostgreSQL convention:

1. **Revert your find & replace** - change all `cmsPages` back to `cmsPages`
2. **Update SQL files** - ensure all use `cmsPages` (unquoted)
3. **Update code** - use `.from("cmsPages")` in all TypeScript/JavaScript

### Option 2: Use Quoted camelCase (Not Recommended)

If you want to keep `cmsPages`, you need to:

1. **Rename the existing table** in database:
```sql
-- Only run if table exists as cmsPages
ALTER TABLE cmsPages RENAME TO "cmsPages";
```

2. **Always use quotes** in SQL:
```sql
CREATE TABLE "cmsPages" (...);  -- ✅ Correct
CREATE TABLE cmsPages (...);   -- ❌ Wrong - becomes "cmspages"
```

3. **Update all references** to use the exact case

### Option 3: Use Lowercase (PostgreSQL Standard)

Use `cmspages` (all lowercase, no underscores):

1. Rename table: `ALTER TABLE cmsPages RENAME TO cmspages;`
2. Update all code to use `cmspages`

## Recommended Fix Steps

**I recommend Option 1 (keep `cmsPages`)** because:
- It's the PostgreSQL convention
- No case-sensitivity issues
- Most PostgreSQL tools expect snake_case
- Less prone to errors

Here's what to do:

1. **Check current table name**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name ILIKE '%cms%page%';
```

2. **If you see `cmsPages`** - good! Just revert your code changes:
```bash
# Revert the find & replace
# Change "cmsPages" back to "cmsPages" in all files
```

3. **If you see `cmspages` or `cmsPages`** - rename it:
```sql
-- From cmspages to cmsPages
ALTER TABLE cmspages RENAME TO cmsPages;

-- OR from "cmsPages" to cmsPages
ALTER TABLE "cmsPages" RENAME TO cmsPages;
```

4. **Verify it worked**:
```sql
SELECT COUNT(*) FROM cmsPages;
```

## Why This Happened

PostgreSQL behavior:
- Unquoted identifiers are **folded to lowercase**
- Quoted identifiers are **case-sensitive**
- Most PostgreSQL conventions use `snake_case` to avoid issues

When you did find & replace, you changed:
- Code: `"cmsPages"` → `"cmsPages"` ✅ (but now references wrong table)
- SQL: `cmsPages` → `cmsPages` ❌ (becomes `cmspages` without quotes!)

## Prevention

For future migrations:
1. Use snake_case for all PostgreSQL tables (convention)
2. If you must use camelCase, **always quote** in SQL
3. Test after renaming tables
4. Use a migration script instead of find & replace

## Need Help?

If your data is missing, it's likely still in the old table. Run:

```sql
-- Check for data in old table name
SELECT COUNT(*) FROM cmsPages;  -- Try this first
SELECT COUNT(*) FROM cmspages;   -- Try this if above fails
SELECT COUNT(*) FROM "cmsPages"; -- Try this if above fails
```

Your data should still be there under one of these names!
