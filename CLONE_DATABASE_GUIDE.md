# Complete Database Clone Guide

## Overview
This guide shows you how to create a complete carbon copy of your production database to your development environment.

## ⚠️ CRITICAL WARNINGS

### Before You Clone:

1. **Your dev database will be COMPLETELY WIPED**
   - All existing data will be deleted
   - This cannot be undone without a backup

2. **Production data includes sensitive information**
   - Real user emails and personal data
   - Real project information
   - Real financial records
   - **DO NOT send emails to users from dev after cloning!**

3. **Storage/File References**
   - Database references to Supabase Storage will point to PRODUCTION buckets
   - Files are NOT copied, only database records
   - You may see broken file links in dev

## Prerequisites

### Install PostgreSQL Tools

**macOS (using Homebrew):**
```bash
brew install postgresql@15
```

**Verify installation:**
```bash
pg_dump --version
psql --version
```

Should show version 15.x or higher.

## Method 1: Automated Script (Recommended)

### Step 1: Get Database Passwords

**Production Password:**
1. Go to https://supabase.com/dashboard/project/qudlxlryegnainztkrtk
2. Click "Settings" → "Database"
3. Find "Connection string" section
4. Click "Reveal" next to the pooler connection string
5. Copy the password (after `postgres.qudlxlryegnainztkrtk:` and before `@`)

**Development Password:**
1. Go to https://supabase.com/dashboard/project/injgmunynstyterczuxg
2. Repeat the same steps to get dev password

### Step 2: Run the Clone Script

```bash
cd /Users/4rgd/Astro/astro-supabase-main
chmod +x clone-production-to-dev.sh
./clone-production-to-dev.sh
```

The script will:
1. ✅ Export entire production database
2. ✅ Save a backup file (keep this!)
3. ✅ Import to development
4. ✅ Verify the import

**Estimated time:** 5-15 minutes depending on database size

## Method 2: Manual Commands

If the script doesn't work, run these commands manually:

### Export Production:
```bash
# Set production password
export PROD_PASSWORD="your_production_password_here"

# Export
pg_dump \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.qudlxlryegnainztkrtk \
  -d postgres \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --schema=public \
  -f production_backup.sql
```

### Import to Development:
```bash
# Set development password
export DEV_PASSWORD="your_development_password_here"

# Import
psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.injgmunynstyterczuxg \
  -d postgres \
  -f production_backup.sql
```

## Method 3: Supabase Dashboard (GUI)

**Currently NOT available** - Supabase doesn't have a built-in clone feature yet. Use Method 1 or 2.

## Method 4: Configuration-Only Clone (Safer)

If you don't want ALL the production data (users, projects, etc.), just copy configuration:

Use the files I created earlier:
- `export-production-data.sql` - Export queries
- `PRODUCTION_EXPORT_GUIDE.md` - Step-by-step guide

This copies ONLY:
- ✅ project_statuses (status definitions)
- ✅ line_items_catalog
- ✅ subject_catalog
- ✅ global_options
- ✅ pdf_templates
- ✅ pdf_components

**Does NOT copy:**
- ❌ User accounts (auth.users, profiles)
- ❌ Projects
- ❌ Files
- ❌ Invoices
- ❌ Messages

## Verification

After cloning, verify in your dev database:

```sql
-- Check project_statuses
SELECT COUNT(*) FROM project_statuses;
-- Should return 20+ rows

-- Check status 10 exists
SELECT status_code, admin_status_name 
FROM project_statuses 
WHERE status_code = 10;

-- Check profiles (if you did full clone)
SELECT COUNT(*) FROM profiles;

-- Check projects (if you did full clone)
SELECT COUNT(*) FROM projects;
```

## Troubleshooting

### Error: "pg_dump: command not found"
Install PostgreSQL tools:
```bash
brew install postgresql@15
```

### Error: "password authentication failed"
- Double-check you copied the entire password from Supabase
- Make sure there are no extra spaces
- Try wrapping password in quotes if it has special characters

### Error: "permission denied"
- Make sure you're using the "Pooler" connection string, not "Direct"
- Port should be 6543, not 5432

### Import hangs or is very slow
- This is normal for large databases
- Wait at least 10-15 minutes
- Check your internet connection

### Error: "relation already exists"
This is fine! The `--clean --if-exists` flags handle this.

## Security Notes

### After Cloning:

1. **Test email sending carefully**
   - Dev will have real user emails
   - Consider disabling email in dev temporarily
   - Or update all emails to test addresses

2. **Update .env if needed**
   ```bash
   # In your .env, you might want:
   DISABLE_EMAILS=true  # Add this
   NODE_ENV=development  # Make sure this is set
   ```

3. **Storage buckets**
   - File uploads will go to DEV buckets
   - But file references might point to PROD
   - Clear file references if needed

## Alternative: Clone Just What You Need

If full clone is overkill, export specific tables:

```bash
# Just project_statuses
pg_dump -h ... -t project_statuses -f statuses.sql

# Multiple tables
pg_dump -h ... \
  -t project_statuses \
  -t line_items_catalog \
  -t global_options \
  -f config_only.sql
```

## Recommended Approach for Your Use Case

Since you mainly need the status definitions to work:

**Option A: Full Clone (if you want real-world test data)**
- Use `clone-production-to-dev.sh`
- Pros: Complete environment, real data for testing
- Cons: Contains sensitive data, larger

**Option B: Config Only (if you just need it working)**
- Use `export-production-data.sql` + guide
- Pros: Safe, no sensitive data, smaller
- Cons: Won't have test projects/users

For your current issue (status 10 not found), **Option B is faster and safer**.

## Next Steps

After successful clone:
1. Test creating a project in localhost
2. Status 10 should now exist
3. Notification workflow should work
4. Check console for "✅ statusData found"

