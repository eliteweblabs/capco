# How to Get Your Supabase PostgreSQL Connection String

## Direct Links (Click These)

**Main Project Dashboard:**
https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel

**Database Settings (Direct):**
https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database

## Step-by-Step Instructions

1. **Click this link:** https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database

2. **Scroll down** to the **"Connection string"** section

3. **Look for the "URI" tab** - it will show something like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
   ```

4. **Copy the ENTIRE connection string** (it includes the password)

5. **Use it directly** - you don't need to replace anything, just copy the whole string

## Alternative: Connection Pooling Tab

If you see a **"Connection pooling"** tab, use that one instead. It's better for production.

The connection string will look like:
```
postgresql://postgres.fhqglhcjlkusrykqnoel:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

## For StudioCMS

Once you have the connection string, add it to your `.env` file as:

```bash
CMS_POSTGRES_URL=postgresql://postgres.fhqglhcjlkusrykqnoel:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
```

**Just paste the entire connection string** - no need to replace anything!

## If You Can't Find It

1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel
2. Click **"Settings"** in the left sidebar
3. Click **"Database"** 
4. Scroll to **"Connection string"** section
5. Click the **"URI"** tab
6. Copy the entire string shown

