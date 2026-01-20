# Schema Comparison Guide: Capco vs Rothco

## Problem
Capco website is missing sidebar items even though both sites run from the same repo.

## Root Cause Analysis

The sidebar navigation is built from:
1. **`site-config.json`** - Defines features and navigation items
2. **`globalSettings` table** - Stores company data and settings
3. **Database tables** - Features depend on specific tables existing

## Quick Comparison Steps

### Step 1: Compare Tables

Run this SQL query on **BOTH** projects:

```sql
-- Run on Capco: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql
-- Run on Rothco: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/sql

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Key tables that affect navigation:**
- `globalSettings` - Company settings and feature flags
- `cmsPages` - CMS pages
- `profiles` - User profiles
- `projects` - Projects
- `files` - Files
- `discussion` - Discussions
- `invoices` - Invoices
- `payments` - Payments
- `ai_agent_conversations` - AI Agent
- `ai_agent_knowledge` - AI Knowledge
- `chatMessages` - Chat
- `chatMessages` - Chat (alternative)
- `notifications` - Notifications
- `bannerAlerts` - Banner alerts

### Step 2: Compare globalSettings

The `globalSettings` table stores configuration that affects navigation:

```sql
-- Run on both projects
SELECT key, category, value_type, 
       CASE WHEN value IS NULL THEN 'NULL' ELSE 'HAS_VALUE' END as has_value
FROM globalSettings
ORDER BY category, key;
```

**Compare the results:**
- If Capco has fewer entries, that's likely the issue
- Missing keys in Capco = missing features in sidebar

### Step 3: Check site-config.json

Both deployments should have the same `site-config.json` file. Verify:

1. Check if `site-config.json` exists in both deployments
2. Compare the `features` section
3. Ensure all features have `enabled: true` and proper `navigation` config

**Expected features in site-config.json:**
- `pdf-system` (Admin/Staff)
- `pdf-certify` (Admin/Staff)
- `voice-assistant` (All roles)
- `ai-agent` (Admin/Staff)
- `calendar` (Admin/Staff)
- `analytics` (Admin)
- `finance` (Admin)
- `global-activity` (Admin)
- `users` (Admin)
- `discussions` (All roles)

### Step 4: Check RLS Policies

Row Level Security policies might block access:

```sql
-- Run on both projects
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('globalSettings', 'cmsPages', 'profiles', 'projects')
ORDER BY tablename, policyname;
```

## Automated Comparison Script

Use the provided script to compare schemas:

```bash
# Set your Supabase keys
export CAPCO_SUPABASE_ANON_KEY="your-capco-anon-key"
export ROTHCO_SUPABASE_ANON_KEY="your-rothco-anon-key"

# Run comparison
node scripts/compare-schemas.js
```

Get your anon keys from:
- Capco: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/api
- Rothco: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/api

## Common Issues & Solutions

### Issue 1: Missing Tables in Capco

**Solution:** Run schema migration from Rothco to Capco:

```bash
# Export schema from Rothco
./scripts/export-schema-pgdump.sh fhqglhcjlkusrykqnoel

# Import to Capco
./scripts/import-schema-pgdump.sh schema-export-*.sql qudlxlryegnainztkrtk
```

### Issue 2: Missing globalSettings Entries

**Solution:** Copy settings from Rothco to Capco:

```sql
-- On Rothco: Export settings
SELECT * FROM globalSettings;

-- On Capco: Insert missing settings
INSERT INTO globalSettings (key, value, category, value_type, description)
VALUES (...);
```

### Issue 3: Different site-config.json

**Solution:** Ensure both deployments use the same `site-config.json` file from the repo.

### Issue 4: RLS Policies Blocking Access

**Solution:** Compare and sync RLS policies:

```sql
-- Export policies from Rothco
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Apply to Capco (adjust as needed)
```

## Quick Fix: Clone Complete Schema

If many differences are found, clone the entire schema:

```bash
# Clone schema from Rothco to Capco
./scripts/clone-schema-automated.sh fhqglhcjlkusrykqnoel qudlxlryegnainztkrtk
```

**⚠️ Warning:** This will overwrite Capco's schema. Backup first!

## Verification

After fixing, verify sidebar shows all items:

1. Log in as Admin on Capco
2. Check sidebar for:
   - PDF System
   - PDF Certify
   - Voice Assistant
   - AI Agent
   - Calendar
   - Analytics
   - Finance
   - Global Activity
   - Users
   - All Discussions

## Next Steps

1. Run the comparison script or SQL queries
2. Identify missing tables/settings
3. Apply fixes using the solutions above
4. Verify sidebar navigation works
