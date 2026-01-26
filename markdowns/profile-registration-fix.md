# Profile Registration Error - Fixed

## Issue

Users were getting the following error during registration:

```json
{
  "error": "Profile creation failed",
  "details": "User account created but profile setup failed. Please contact support."
}
```

## Root Cause

The registration flow uses the following sequence:

1. Create user account using `supabase.auth.signUp()` 
2. Create profile record using `supabaseAdmin.from("profiles").insert()`

The problem was that `supabaseAdmin` uses the **service_role** key, which has elevated permissions but still respects Row Level Security (RLS) policies. 

The `profiles` table had INSERT policies for the `authenticated` role, but **not** for the `service_role`. This meant that during registration, when trying to create the profile record, the service role couldn't insert because:

- The existing INSERT policy checked `auth.uid() = id`
- Service role operations don't have an `auth.uid()` context
- Therefore, the INSERT was rejected

## Solution

Added two new RLS policies specifically for the `service_role`:

```sql
-- Allow service_role to INSERT profiles during registration
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service_role to SELECT profiles (needed to return created profile)
CREATE POLICY "Service role can select profiles"
  ON profiles FOR SELECT
  TO service_role
  USING (true);
```

## Applied Fix

✅ **The fix has been applied to the database**

The following policies are now active on the `profiles` table:

| Policy Name | Command | Roles | Purpose |
|------------|---------|-------|---------|
| `Service role can insert profiles` | INSERT | service_role | Allows registration endpoint to create profiles |
| `Service role can select profiles` | SELECT | service_role | Allows registration endpoint to read back created profile |
| `profiles_insert_own` | INSERT | authenticated | Allows users to create their own profile |
| `profiles_select_own` | SELECT | authenticated | Allows users to view their own profile |
| `profiles_select_admin` | SELECT | authenticated | Allows admins to view all profiles |
| `profiles_update_own` | UPDATE | authenticated | Allows users to update their own profile |
| `profiles_update_admin` | UPDATE | authenticated | Allows admins to update profiles |

## Testing

The registration flow should now work correctly:

1. Navigate to `/auth/login`
2. Click "Register" or go to registration page
3. Fill out the multi-step form:
   - Email
   - First/Last Name
   - Company Name
   - Password
   - Phone Number
4. Submit registration
5. Profile should be created successfully ✅

## Additional Improvements

Also added enhanced error logging to the registration endpoint (`src/pages/api/auth/register.ts`):

- Now logs the full profile payload being inserted
- Logs detailed error information including:
  - Error message
  - Error details
  - Error hint
  - Error code
- Returns more detailed error information to help debug future issues

## Files Modified

1. **Database**: Applied RLS policies via Supabase MCP tools ✅
2. `sql-queriers/fix-profiles-registration.sql` - SQL fix script
3. `scripts/fix-profiles-registration.sh` - Shell script to apply fix
4. `src/pages/api/auth/register.ts` - Enhanced error logging
5. `markdowns/profile-registration-fix.md` - This documentation

## Prevention

To prevent this issue in the future:

1. Always check RLS policies when using `supabaseAdmin` (service_role)
2. Service role bypasses RLS by default, but Supabase enables RLS by default
3. Service role still needs explicit policies if RLS is enabled
4. Add comprehensive error logging to catch issues early

## Related Files

- Registration Form: `src/components/form/MultiStepRegisterForm.astro`
- Registration API: `src/pages/api/auth/register.ts`
- Supabase Admin Client: `src/lib/supabase-admin.ts`
- Profile Schema: `sql-queriers/dev-database-migration.sql`
