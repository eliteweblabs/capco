# Disable SSL in Supabase

## Steps to Disable SSL

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/qudlxlryegnainztkrtk/settings/database

2. **Look for SSL/TLS settings** - This might be under:
   - Database settings
   - Connection settings
   - Security settings

3. **Disable SSL requirement** - The exact location depends on your Supabase plan/version

## Alternative: Use Local Development Mode

If you're running Supabase locally, SSL might not be required. Check your Supabase configuration.

## After Disabling SSL

Once SSL is disabled in Supabase, you can run migrations without SSL:

```bash
npx studiocms migrate --latest
```

## Note

⚠️ **Security Warning**: Disabling SSL is not recommended for production. Only disable SSL for local development.

