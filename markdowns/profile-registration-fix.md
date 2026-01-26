# Profile Registration Errors - Fixed

## Issues Encountered

### Issue 1: Profile Creation Failed (No Policy)

Users were getting the following error during registration:

```json
{
  "error": "Profile creation failed",
  "details": "User account created but profile setup failed. Please contact support."
}
```

### Issue 2: Duplicate Key Violation

After fixing Issue 1, users who had a failed registration attempt would get:

```json
{
  "error": "Profile creation failed",
  "details": "User account created but profile setup failed. Error: duplicate key value violates unique constraint \"profiles_pkey\"",
  "debugInfo": {
    "code": "23505",
    "hint": null
  }
}
```

## Root Causes

### Issue 1: Missing RLS Policies for Service Role

The registration flow uses the following sequence:

1. Create user account using `supabase.auth.signUp()`
2. Create profile record using `supabaseAdmin.from("profiles").insert()`

The problem was that `supabaseAdmin` uses the **service_role** key, which has elevated permissions but still respects Row Level Security (RLS) policies.

The `profiles` table had INSERT policies for the `authenticated` role, but **not** for the `service_role`. This meant that during registration, when trying to create the profile record, the service role couldn't insert because:

- The existing INSERT policy checked `auth.uid() = id`
- Service role operations don't have an `auth.uid()` context
- Therefore, the INSERT was rejected

### Issue 2: Duplicate Key on Retry

When registration failed at the profile creation step:

1. User account was successfully created in `auth.users`
2. Profile creation failed (due to Issue 1)
3. User tries to register again with same email
4. Supabase allows re-registration (creates or returns existing user)
5. Profile INSERT fails with duplicate key error (user ID already exists in profiles table)

The code was using `.insert()` which doesn't handle existing records. When a user retried registration, the user account already existed, causing a primary key violation.

## Solutions Applied

### Fix 1: Add Service Role RLS Policies

Added three new RLS policies specifically for the `service_role`:

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

-- Allow service_role to UPDATE profiles (needed for UPSERT)
CREATE POLICY "Service role can update profiles"
  ON profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Fix 2: Use UPSERT Instead of INSERT

Changed the profile creation logic from `.insert()` to `.upsert()`:

```typescript
// Before (INSERT only)
const { data: profileData, error: profileError } = await supabaseAdmin
  .from("profiles")
  .insert([profilePayload])
  .select()
  .single();

// After (UPSERT - handles both new and existing profiles)
const { data: profileData, error: profileError } = await supabaseAdmin
  .from("profiles")
  .upsert([profilePayload], {
    onConflict: "id",
    ignoreDuplicates: false,
  })
  .select()
  .single();
```

This ensures that:

- If profile doesn't exist → Creates new profile
- If profile exists (from failed previous attempt) → Updates the existing profile
- No duplicate key errors

## Applied Fixes

✅ **Both fixes have been applied to the database and code**

### Database Policies

The following policies are now active on the `profiles` table:

| Policy Name                        | Command | Roles         | Purpose                                                   |
| ---------------------------------- | ------- | ------------- | --------------------------------------------------------- |
| `Service role can insert profiles` | INSERT  | service_role  | Allows registration endpoint to create profiles           |
| `Service role can select profiles` | SELECT  | service_role  | Allows registration endpoint to read back created profile |
| `Service role can update profiles` | UPDATE  | service_role  | Allows registration endpoint to update existing profiles  |
| `profiles_insert_own`              | INSERT  | authenticated | Allows users to create their own profile                  |
| `profiles_select_own`              | SELECT  | authenticated | Allows users to view their own profile                    |
| `profiles_select_admin`            | SELECT  | authenticated | Allows admins to view all profiles                        |
| `profiles_update_own`              | UPDATE  | authenticated | Allows users to update their own profile                  |
| `profiles_update_admin`            | UPDATE  | authenticated | Allows admins to update profiles                          |

### Code Changes

**File**: `src/pages/api/auth/register.ts`

1. Changed `.insert()` to `.upsert()` with conflict resolution
2. Enhanced error handling for duplicate key errors
3. Added better error messages for common scenarios

## Testing

The registration flow should now work correctly in all scenarios:

### Scenario 1: New User Registration

1. Navigate to `/auth/login`
2. Click "Register" or go to registration page
3. Fill out the multi-step form
4. Submit registration
5. Profile should be created successfully ✅

### Scenario 2: Retry After Failed Registration

1. Previous registration attempt failed at profile creation
2. User tries to register again with same email
3. UPSERT updates the existing profile instead of failing ✅
4. Registration completes successfully

### Scenario 3: Duplicate Email (Already Registered)

1. User tries to register with email that already has complete registration
2. System shows appropriate error message ✅

## Additional Improvements

Also added enhanced error logging and handling to the registration endpoint (`src/pages/api/auth/register.ts`):

1. **Detailed logging**:
   - Logs the full profile payload being inserted
   - Logs detailed error information (code, hint, message, details)
2. **Better error messages**:
   - Duplicate key errors now show "This account already exists. Please try logging in instead."
   - Generic errors provide debug information for troubleshooting
3. **UPSERT logic**:
   - Handles both new registrations and retry scenarios
   - Prevents duplicate key violations
   - Updates existing profiles when needed

## Files Modified

1. **Database**: Applied RLS policies via Supabase MCP tools ✅
2. `sql-queriers/fix-profiles-registration.sql` - SQL fix script
3. `scripts/fix-profiles-registration.sh` - Shell script to apply fix
4. `src/pages/api/auth/register.ts` - Enhanced error logging
5. `markdowns/profile-registration-fix.md` - This documentation

## Prevention

To prevent similar issues in the future:

1. **Always use UPSERT for user profiles**: Use `.upsert()` instead of `.insert()` when creating user profiles to handle retry scenarios gracefully

2. **Check RLS policies when using service_role**:
   - Service role still respects RLS policies
   - Always create explicit policies for service_role operations
   - Test with service role, not just authenticated users

3. **Add comprehensive error logging**:
   - Log error codes to identify specific issues
   - Include context (payload, user ID, etc.)
   - Return helpful error messages to users

4. **Handle duplicate scenarios gracefully**:
   - Use conflict resolution (`onConflict: "id"`)
   - Provide clear error messages
   - Don't leave orphaned records

5. **Test edge cases**:
   - Failed registration retry
   - Network interruption during registration
   - Browser refresh mid-registration

## Related Files

- Registration Form: `src/components/form/MultiStepRegisterForm.astro`
- Registration API: `src/pages/api/auth/register.ts`
- Supabase Admin Client: `src/lib/supabase-admin.ts`
- Profile Schema: `sql-queriers/dev-database-migration.sql`
