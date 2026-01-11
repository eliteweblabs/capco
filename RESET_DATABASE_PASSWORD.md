# Reset Supabase Database Password

## Why You See `[your-password]`

Supabase doesn't store your database password in plain text for security. If you see `[your-password]` as a placeholder, you need to reset it to get a new password.

## Steps to Reset Password

1. **Go to your project dashboard:**
   https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database

2. **Scroll to "Database Password" section**

3. **Click "Reset Database Password"** button

4. **Copy the new password** that appears (or generate a new one)

5. **Use it in your connection string:**
   ```bash
   CMS_POSTGRES_URL=postgresql://postgres:[NEW-PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres
   ```

## Alternative: Use Connection Pooling

Connection pooling uses a different authentication method. Try this:

1. Go to: https://supabase.com/dashboard/project/fhqglhcjlkusrykqnoel/settings/database
2. Look for **"Connection pooling"** tab
3. Use the **"Session"** or **"Transaction"** mode connection string
4. This might have different credentials that are easier to access

## After Resetting

Once you have the new password:

1. Add to `.env`:
   ```bash
   CMS_POSTGRES_URL=postgresql://postgres:[NEW-PASSWORD]@db.fhqglhcjlkusrykqnoel.supabase.co:5432/postgres
   ```

2. Run migrations:
   ```bash
   npx studiocms migrate --latest
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

## Security Note

⚠️ **Save the password securely** - Supabase won't show it again after you close the dialog. Consider using a password manager.

