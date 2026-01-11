# StudioCMS Database Connection Setup

## Supabase Project Details

**Project:** Rothco  
**Project ID:** `fhqglhcjlkusrykqnoel`  
**Database Host:** `db.fhqglhcjlkusrykqnoel.supabase.co`  
**Region:** `us-west-2`  
**API URL:** `https://fhqglhcjlkusrykqnoel.supabase.co`

## Get Your Database Password

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection string** section
4. Look for **URI** or **Connection pooling** tab
5. Copy your database password (or reset it if needed)

## Connection String Format

### Option 1: Direct Connection (Recommended for StudioCMS)
```
postgresql://postgres:[YOUR-PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres
```

### Option 2: Connection Pooler (For production/high traffic)
```
postgresql://postgres.fhqglhcjlkusrykqnoel:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

## Set Environment Variable

Add this to your `.env` file:

```bash
# StudioCMS PostgreSQL Connection (Direct)
CMS_POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres
```

**Or for Railway, add it as an environment variable:**
- Variable Name: `CMS_POSTGRES_URL`
- Value: `postgresql://postgres:[YOUR-PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres`

## Quick Setup Steps

1. **Get password from Supabase Dashboard** (Settings → Database)
2. **Replace `[YOUR-PASSWORD]`** in the connection string above
3. **Add to `.env` file** or Railway environment variables
4. **Run migrations:**
   ```bash
   npx studiocms migrate --latest
   ```
5. **Start dev server:**
   ```bash
   npm run dev
   ```
6. **Initialize database:** Visit `http://localhost:4321/start`

## Security Note

⚠️ **Never commit your `.env` file or expose the database password!**

The password contains sensitive credentials. Keep it secure and only add it to:
- Local `.env` file (already in `.gitignore`)
- Railway environment variables (encrypted)
- Other secure secret management systems

