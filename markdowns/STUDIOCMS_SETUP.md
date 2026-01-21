# StudioCMS Setup Guide

## Installation Complete ✅

StudioCMS has been installed and configured. Follow these steps to complete setup:

## Step 1: Get Supabase PostgreSQL Connection String

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Copy the **URI** connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

## Step 2: Set Environment Variable

Add this to your `.env` file (or Railway environment variables):

```bash
# StudioCMS PostgreSQL Connection
CMS_POSTGRES_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Important:** Replace `[YOUR-PASSWORD]` with your actual database password and `[PROJECT-REF]` with your Supabase project reference.

## Step 3: Run Migrations

Run the StudioCMS migrations to set up the database schema:

```bash
npx studiocms migrate --latest
```

## Step 4: Initialize Database (First Time Only)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:4321/start`
   - This is the database initialization page (enabled by `dbStartPage: true` in `studiocms.config.mjs`)
   - Follow the on-screen instructions to initialize your database

3. After initialization, set `dbStartPage: false` in `studiocms.config.mjs` and restart the server

## Step 5: Access StudioCMS Dashboard

Once initialized, access the StudioCMS dashboard at:
- **Dashboard**: `http://localhost:4321/dashboard`
- **API**: `http://localhost:4321/studiocms_api`

## Configuration Files

- **StudioCMS Config**: `studiocms.config.mjs` - Main configuration file
- **Astro Config**: `astro.config.mjs` - StudioCMS integration added

## Next Steps

1. Create content types in the StudioCMS dashboard
2. Migrate existing markdown content to StudioCMS
3. Update your content loading code to use StudioCMS SDK/API

## Troubleshooting

- **Database connection errors**: Verify `CMS_POSTGRES_URL` is correct and accessible
- **Migration errors**: Ensure database has proper permissions
- **Dashboard not loading**: Check that migrations ran successfully

