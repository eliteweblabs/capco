# Local Test Users

These test users are automatically created when you run `supabase db reset`. They are included in the seed file at `supabase/seed.sql`.

## Test Accounts

### Admin Account 1

- **Email**: `admin@test.com`
- **Password**: `admin123`
- **Role**: Admin
- **Name**: Test Admin

### Admin Account 2

- **Email**: `test@example.com`
- **Password**: `password123`
- **Role**: Admin
- **Name**: Test User

## Usage

1. Start your local Supabase: `supabase start`
2. Reset database with seed data: `supabase db reset`
3. Start dev server: `npm run dev`
4. Login at: `http://localhost:4321/auth/login`

## Updating Test Users

If you need to add more test users or change passwords:

1. Create the user via Supabase Auth:

   ```bash
   curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \
     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
     -H "Content-Type: application/json" \
     -d '{"email":"new@example.com","password":"password123"}'
   ```

2. Dump the auth tables:

   ```bash
   docker exec supabase_db_astro-supabase-main pg_dump -U postgres \
     --data-only --table=auth.users --table=auth.identities > /tmp/new_users.sql
   ```

3. Add the INSERT statements to `supabase/seed.sql`

4. Add the profile INSERT for the new user to `supabase/seed.sql`

## Notes

- Test users are stored in the seed file with encrypted passwords (bcrypt hashes)
- When you run `supabase db reset`, the seed file is automatically applied
- Test users have Admin role by default for full access during development
- The seed file is tracked in git, so all team members get the same test users
