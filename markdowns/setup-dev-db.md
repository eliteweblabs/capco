# Development Database Setup Guide

## Step 1: Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Name: `capco-dev` or `capco-development`
4. Choose same region as production
5. Set database password
6. Wait for project to be created (~2 minutes)

## Step 2: Get Your New Credentials

Once created, go to **Settings** → **API**:

Copy these values (you'll need them for Step 4):

- **Project URL**: `https://[your-project-id].supabase.co`
- **anon key**: `eyJ...` (long string)
- **service_role key**: `eyJ...` (long string)

## Step 3: Configure Authentication

Go to **Authentication** → **URL Configuration**:

### Site URL

```
http://localhost:4321
```

(NO trailing slash!)

### Redirect URLs (Add these)

```
http://localhost:4321/api/auth/verify
http://localhost:4321/api/auth/callback
```

## Step 4: Update Your .env File

Create a backup first:

```bash
cp .env .env.backup
```

Then update these lines in `.env`:

```bash
# DEVELOPMENT Supabase Configuration
PUBLIC_SUPABASE_URL=https://[your-new-dev-project].supabase.co
SUPABASE_ANON_KEY=[your-new-dev-anon-key]
SUPABASE_ANON_KEY=[your-new-dev-service-role-key]

# Make sure these are set
NODE_ENV=development
RAILWAY_PUBLIC_DOMAIN=http://localhost:4321
```

## Step 5: Copy Database Schema from Production

### Option A: SQL Editor Export (Recommended)

1. Go to your **PRODUCTION** Supabase dashboard
2. Open **SQL Editor**
3. Create a new query and run:

```sql
-- Export all your table schemas
-- Copy the output and save to a file

-- Get all tables
SELECT
  'CREATE TABLE ' || table_name || ' (' ||
  string_agg(
    column_name || ' ' || data_type ||
    CASE WHEN character_maximum_length IS NOT NULL
      THEN '(' || character_maximum_length || ')'
      ELSE ''
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;
```

4. Go to your **DEVELOPMENT** Supabase dashboard
5. Open **SQL Editor**
6. Create and run the table creation statements

### Option B: Use Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref [production-project-id]

# Generate migration from production
supabase db pull

# Link to development project
supabase link --project-ref [dev-project-id]

# Apply migration to development
supabase db push
```

## Step 6: Common Tables to Create

At minimum, you need these tables:

### profiles table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'Client',
  sms_alerts BOOLEAN DEFAULT false,
  mobile_carrier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );
```

### projects table

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  address TEXT,
  status INTEGER DEFAULT 0,
  sq_ft INTEGER,
  new_construction BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );
```

### files table

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT,
  status TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
```

## Step 7: Create Database Trigger

Create a trigger to automatically create profiles when users sign up:

```sql
-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Step 8: Test Your Development Database

1. Restart your dev server:

   ```bash
   npm run dev
   ```

2. Try to create a new user via the admin panel

3. Check the console logs for:

   ```
   🔗 [EMAIL-DELIVERY] Base URL: http://localhost:4321
   🔗 [EMAIL-DELIVERY] Magic link generated successfully
   ```

4. Check the magic link in email - should now use `http://localhost:4321`

## Step 9: Keep Production Config Handy

Save your production config in `.env.production` for easy switching:

```bash
# Copy current production values to a separate file
echo "# Production Supabase Config" > .env.production
echo "PUBLIC_SUPABASE_URL=https://qudlxlryegnainztkrtk.supabase.co" >> .env.production
echo "SUPABASE_ANON_KEY=[production-anon-key]" >> .env.production
echo "SUPABASE_ANON_KEY=[production-service-role-key]" >> .env.production
echo "NODE_ENV=production" >> .env.production
echo "RAILWAY_PUBLIC_DOMAIN=https://capcofire.com" >> .env.production
```

## Troubleshooting

### Magic links still use production URL

- Check Supabase dev project Site URL is set to `http://localhost:4321`
- Restart your dev server after changing .env

### Tables not found

- Make sure you copied all table schemas from production
- Check RLS policies are created

### Authentication errors

- Verify your anon key and service role key are correct
- Check that redirect URLs are added in Supabase auth settings

## Benefits of This Setup

✅ Development and production are completely isolated
✅ Can test user creation without affecting production
✅ Magic links work correctly in both environments
✅ No need to constantly change Supabase settings
✅ Can test database changes safely before deploying

## Quick Switch Between Environments

### For Development:

```bash
cp .env.development .env
npm run dev
```

### For Production Build:

```bash
cp .env.production .env
npm run build
```
