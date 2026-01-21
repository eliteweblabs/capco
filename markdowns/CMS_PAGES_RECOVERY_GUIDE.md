# CMS Pages Data Recovery Guide

## Good News: Your Data Can Be Recovered! 🎉

Your markdown source files still exist in the `/markdowns` folder (125+ files). We can re-import them.

## Supabase Backup Options

### Free Tier (Limited)
- ❌ No automatic daily backups
- ❌ No Point-in-Time Recovery (PITR)
- ✅ You can export data manually via SQL or API

### Pro Tier ($25/month)
- ✅ Daily automated backups
- ✅ Point-in-Time Recovery (PITR) - restore to any point in the last 7 days
- ✅ Physical backups stored securely

### Enterprise Tier
- ✅ All Pro features
- ✅ Longer backup retention
- ✅ Custom backup schedules

## Check Your Supabase Plan

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Settings** → **Billing**
4. Check if you have **Pro plan** or higher

## Recovery Options

### Option 1: Re-import from Markdown Files (Recommended)

Since your markdown files still exist, you can re-import them:

#### Step 1: Recreate the Table

Run this in **Supabase SQL Editor**:

```sql
-- Drop the table if it exists (be careful!)
DROP TABLE IF EXISTS cmsPages CASCADE;

-- Recreate with proper name
CREATE TABLE cmsPages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT NOT NULL,
  frontmatter JSONB DEFAULT '{}',
  template TEXT DEFAULT 'default',
  client_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  include_in_navigation BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  nav_roles TEXT[] DEFAULT ARRAY['any'::TEXT],
  nav_page_type TEXT DEFAULT 'frontend',
  nav_button_style TEXT,
  nav_desktop_only BOOLEAN DEFAULT false,
  nav_hide_when_auth BOOLEAN DEFAULT false,
  
  CONSTRAINT unique_slug_per_client UNIQUE (slug, client_id)
);

-- Create indexes
CREATE INDEX idx_cmsPages_slug ON cmsPages(slug);
CREATE INDEX idx_cmsPages_client_id ON cmsPages(client_id);
CREATE INDEX idx_cmsPages_active ON cmsPages(is_active) WHERE is_active = true;
CREATE INDEX idx_cmsPages_display_order ON cmsPages(display_order);

-- Enable RLS
ALTER TABLE cmsPages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active pages
CREATE POLICY "Anyone can read active CMS pages"
  ON cmsPages FOR SELECT
  USING (is_active = true);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_cmsPages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_cmsPages_timestamp
  BEFORE UPDATE ON cmsPages
  FOR EACH ROW
  EXECUTE FUNCTION update_cmsPages_updated_at();

-- Verify
SELECT 'Table cmsPages created successfully!' as status;
```

#### Step 2: Update Your Code

If you haven't already, revert all `cmsPages` references back to `cmsPages`:

```bash
# In your terminal
cd /Users/4rgd/Astro/rothcobuilt

# Find all files that reference cmsPages
grep -r "cmsPages" --include="*.ts" --include="*.js" --include="*.astro" src/
```

#### Step 3: Re-import All Markdown Files

Your app already has an import API! Use it:

**Option A: Via Admin UI**
1. Start your dev server: `npm run dev`
2. Go to `http://localhost:4321/admin/cms`
3. Click **"Import All Markdown"** button
4. Wait for import to complete

**Option B: Via API Directly**

```bash
# Call the import API
curl -X POST http://localhost:4321/api/cms/import-all-markdown
```

**Option C: Via Browser Console**

1. Go to your admin page
2. Open browser console (F12)
3. Run:
```javascript
fetch('/api/cms/import-all-markdown', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Import complete:', data));
```

### Option 2: Point-in-Time Recovery (Pro Plan Only)

If you have a **Pro plan or higher**, you can restore your database:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Database** → **Backups**
4. Click **"Point in Time Recovery"**
5. Select a time **before you deleted the data**
6. Click **"Restore"**

⚠️ **Warning**: This will restore your ENTIRE database to that point in time, affecting all tables.

### Option 3: Contact Supabase Support

Even on free tier, you can try:

1. Go to [Supabase Support](https://supabase.com/dashboard/support/new)
2. Explain the situation
3. Provide:
   - Project ID
   - Approximate time of data loss
   - Table name that was affected

They may have short-term backups or logs that could help.

## Prevention for the Future

### 1. Enable Daily Exports (Free Tier)

Create a daily export script:

```bash
# Create export script
cat > scripts/backup-cms-pages.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
pg_dump -h db.fhqglhcjlkusrykqnoel.supabase.co \
  -U postgres \
  -d postgres \
  -t cmsPages \
  > backups/cmsPages_$DATE.sql
EOF

chmod +x scripts/backup-cms-pages.sh

# Run daily via cron
crontab -e
# Add: 0 2 * * * /Users/4rgd/Astro/rothcobuilt/scripts/backup-cms-pages.sh
```

### 2. Upgrade to Pro ($25/month)

Benefits:
- Automatic daily backups
- Point-in-Time Recovery
- Better performance
- More database space

### 3. Keep Markdown Files Synced

Your current setup is good - keep markdown files as source of truth in git.

### 4. Add Git Pre-commit Hook

Automatically export CMS data before commits:

```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Export CMS pages before commit
node scripts/export-cms-to-markdown.js
git add markdowns/
EOF

chmod +x .git/hooks/pre-commit
```

## Immediate Action Steps

1. ✅ **Recreate the table** (run SQL above)
2. ✅ **Update code** (revert cmsPages → cmsPages)
3. ✅ **Re-import markdown files** (use API)
4. ✅ **Verify data** (check admin CMS page)
5. ✅ **Consider Pro plan** for automatic backups

## Need Help?

I can help you:
1. Write the code revert script
2. Create an automated backup solution
3. Set up export scripts
4. Test the recovery process

Let me know what you'd like to do first!
