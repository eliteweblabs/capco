# Fix Capco Missing Sidebar Items

## Current Status
- ✅ Capco has `global_settings` table (16 entries vs Rothco's 18)
- ❓ Need to check if key tables exist

## The Real Issue

The sidebar navigation is built from **`site-config.json`** features, which require specific **database tables** to exist. Missing tables = missing sidebar items.

## Quick Diagnosis

Run this SQL on **Capco**:
https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql

```sql
-- Check which key tables exist
SELECT 
  'global_settings' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'global_settings'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 'ai_agent_conversations',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ai_agent_conversations'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'ai_agent_knowledge',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ai_agent_knowledge'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 'chatMessages',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'chatMessages'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;
```

## Expected Sidebar Items (from site-config.json)

These features should appear if their tables exist:

1. **All Discussions** - requires `discussion` table
2. **Calendar** - requires `schedules` table  
3. **PDF System** - requires `pdfTemplates`, `pdfGenerationJobs` tables
4. **PDF Certify** - requires `pdfTemplates` table
5. **Analytics** - requires `projects`, `files` tables
6. **Finance** - requires `invoices`, `payments` tables
7. **Voice Assistant** - requires `chatMessages` or `chat_messages` table
8. **AI Agent** - requires `ai_agent_conversations`, `ai_agent_knowledge` tables
9. **Global Activity** - requires `projects`, `files`, `discussion` tables
10. **Users** - requires `profiles` table

## Quick Fix: Clone Schema

If tables are missing, clone the complete schema from Rothco:

```bash
# Clone schema from Rothco to Capco
./scripts/clone-schema-automated.sh fhqglhcjlkusrykqnoel qudlxlryegnainztkrtk
```

**⚠️ Warning:** This will overwrite Capco's schema. Make a backup first!

## Alternative: Check Railway Environment

The issue might also be:
1. **Different `site-config.json`** - Check if Capco deployment has the file
2. **Environment variables** - Check Railway env vars for Capco vs Rothco
3. **Code version** - Ensure both deployments use same git commit

## Next Steps

1. ✅ Run the SQL query above on Capco
2. ✅ Identify which tables are missing
3. ✅ Clone schema if tables are missing
4. ✅ Verify sidebar shows all items

## Missing Settings (Not Critical)

Capco has 16 settings vs Rothco's 18. To find which 2 are missing, run:

```sql
-- On Capco
SELECT category, COUNT(*) as count, string_agg(key, ', ') as keys
FROM global_settings
GROUP BY category
ORDER BY category;
```

Compare with Rothco's breakdown:
- colors: 2 (primary_color, secondary_color)
- company: 6 (address, company_name, email, phone, slogan, website)
- general: 8 (font_family, og_image, plausible_*, secondary_font_family, social_networks)
- icons: 1 (icon)
- logos: 1 (logo)

If settings are missing, you can add them manually, but **this won't fix the sidebar issue** - that's caused by missing tables.
