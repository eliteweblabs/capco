# Capco vs Rothco Schema Comparison Results

## Current Status (Rothco - Connected via MCP)

### ✅ Tables Present in Rothco
All key navigation-related tables exist:
- ✅ `global_settings` (18 entries)
- ✅ `cms_pages`
- ✅ `profiles`
- ✅ `projects`
- ✅ `files`
- ✅ `discussion`
- ✅ `invoices`
- ✅ `payments`
- ✅ `ai_agent_conversations`
- ✅ `ai_agent_knowledge`
- ✅ `chatMessages`
- ✅ `chat_messages`
- ✅ `notifications`
- ✅ `bannerAlerts`

### 📊 global_settings Breakdown (Rothco)
- **colors**: 2 keys (primary_color, secondary_color)
- **company**: 6 keys (address, company_name, email, phone, slogan, website)
- **general**: 8 keys (font_family, og_image, plausible_*, secondary_font_family, social_networks)
- **icons**: 1 key (icon)
- **logos**: 1 key (logo)

**Total: 18 settings**

## Expected Sidebar Items (from site-config.json)

Based on `site-config.json`, these features should appear in the sidebar:

### Admin Section (Admin/Staff roles):
1. **All Discussions** (position: 10)
2. **Calendar** (position: 20)
3. **PDF System** (position: 30)
4. **PDF Certify** (position: 31)
5. **Analytics** (position: 40)
6. **Finance** (position: 41)
7. **Voice Assistant** (position: 50) - Tools section
8. **AI Agent** (position: 51) - Tools section
9. **Global Activity** (position: 60)
10. **Users** (position: 70)

## Next Steps to Diagnose Capco

### Option 1: Quick SQL Check (Recommended)

Run this query on **Capco** Supabase SQL Editor:
https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/sql

```sql
-- 1. Check if key tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'global_settings') 
    THEN 'EXISTS' ELSE 'MISSING' END as global_settings,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cms_pages') 
    THEN 'EXISTS' ELSE 'MISSING' END as cms_pages,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_agent_conversations') 
    THEN 'EXISTS' ELSE 'MISSING' END as ai_agent_conversations,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chatMessages') 
    THEN 'EXISTS' ELSE 'MISSING' END as chatMessages;

-- 2. Count global_settings entries
SELECT COUNT(*) as setting_count FROM global_settings;

-- 3. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Option 2: Use Comparison Script

1. Get your Capco anon key:
   - Go to: https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/api
   - Copy the "anon" key

2. Run the comparison script:
```bash
export CAPCO_SUPABASE_ANON_KEY="your-capco-anon-key-here"
export ROTHCO_SUPABASE_ANON_KEY="your-rothco-anon-key-here"
node scripts/compare-schemas.js
```

### Option 3: Clone Schema from Rothco to Capco

If tables are missing, clone the schema:

```bash
# This will copy the complete schema from Rothco to Capco
./scripts/clone-schema-automated.sh fhqglhcjlkusrykqnoel qudlxlryegnainztkrtk
```

**⚠️ Warning:** This overwrites Capco's schema. Backup first!

## Most Likely Issues

Based on the symptoms (missing sidebar items), the most likely causes are:

1. **Missing Tables** - Capco database doesn't have all required tables
   - Solution: Run schema migration/clone

2. **Missing global_settings Entries** - Capco has fewer settings than Rothco
   - Solution: Copy settings from Rothco

3. **Different site-config.json** - Capco deployment has different config file
   - Solution: Ensure both use same `site-config.json` from repo

4. **RLS Policies** - Row Level Security blocking access to data
   - Solution: Compare and sync RLS policies

## Quick Fix Checklist

- [ ] Run SQL queries on Capco to check table existence
- [ ] Compare `global_settings` count (should be ~18)
- [ ] Verify `site-config.json` is identical in both deployments
- [ ] Check RLS policies on key tables
- [ ] If differences found, clone schema from Rothco to Capco
- [ ] Verify sidebar shows all expected items after fix

## Files Created

1. `SCHEMA_COMPARISON_GUIDE.md` - Detailed comparison guide
2. `scripts/compare-schemas.js` - Automated comparison script
3. `scripts/compare-schemas-sql.sql` - SQL queries for manual comparison
4. `CAPCO_ROTHCO_SCHEMA_DIFF.md` - This summary document

## Support

If issues persist:
1. Check Railway logs for Capco deployment
2. Verify environment variables match between deployments
3. Ensure both deployments are using the same codebase version
