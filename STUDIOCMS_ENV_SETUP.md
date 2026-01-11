# StudioCMS Environment Variables Setup

## Required Environment Variables for PostgreSQL

StudioCMS uses individual environment variables (not a connection string). Add these to your `.env` file:

```bash
# PostgreSQL Connection (Rothco Project)
CMS_PG_DATABASE=postgres
CMS_PG_USER=postgres
CMS_PG_PASSWORD=[YOUR-PASSWORD]
CMS_PG_HOST=db.fhqglhcjlkusrykqnoel.supabase.co
CMS_PG_PORT=5432

# Optional: Encryption Key (for secure features)
CMS_ENCRYPTION_KEY=[generate-a-random-32-char-key]
```

## Get Your Password

1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database
2. Reset Database Password if needed
3. Copy the password

## Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Connection String Alternative

If you prefer using a connection string, StudioCMS might also accept:
```bash
CMS_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres
```

But the individual variables (CMS_PG_*) are recommended.

