# Fix Display Name Issue

## Problem

Users registering with the standard registration form (not Google OAuth) are not getting their display names saved to their profiles. The database trigger was only looking for `name` and `full_name` in user metadata, but not `display_name`.

## Solution

### 1. Fix the Database Trigger

Run this SQL in your Supabase SQL Editor:

```sql
-- Execute the fix
```

Then run:

```bash
# In Supabase Dashboard > SQL Editor
./fix-profile-display-name.sql
```

This will:

- ✅ Update the `handle_new_user()` trigger function to prioritize `display_name`
- ✅ Fix existing profiles that have missing/generic names
- ✅ Update phone numbers that might be missing
- ✅ Show a sample of updated profiles

### 2. Fix Existing Users (Optional)

If you want to fix existing users programmatically via API:

```bash
# Call the fix API (must be logged in as Admin)
curl -X POST "http://localhost:4324/api/fix-user-profiles" \
  -H "Content-Type: application/json" \
  -b "your-session-cookies"
```

## How It Works Now

### Registration Priority Order

When users register, their profile name will be set using this priority:

1. **`display_name`** - From registration form ✅
2. **`full_name`** - If provided in metadata
3. **Constructed name** - `first_name + last_name`
4. **`name`** - From OAuth providers
5. **`email`** - As fallback
6. **"User"** - Final fallback

### Database Trigger (Enhanced)

```sql
COALESCE(
  NEW.raw_user_meta_data->>'display_name',  -- ✅ Now prioritized!
  NEW.raw_user_meta_data->>'full_name',
  CONCAT(first_name, ' ', last_name),
  NEW.raw_user_meta_data->>'name',
  NEW.email,
  'User'
)
```

### Updated Files

- ✅ `fix-profile-display-name.sql` - Database trigger fix
- ✅ `src/lib/auth-utils.ts` - Enhanced profile creation logic
- ✅ `src/pages/api/fix-user-profiles.ts` - Manual fix endpoint

## Testing

### 1. Test New Registration

1. Register a new user with the standard form
2. Fill in the "Company/Display Name" field
3. Check that the profile name matches the display name

### 2. Check Existing Users

```sql
-- Check user metadata vs profile names
SELECT
  p.name as profile_name,
  au.email,
  au.raw_user_meta_data->>'display_name' as display_name,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'first_name' as first_name,
  au.raw_user_meta_data->>'last_name' as last_name
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY au.created_at DESC;
```

## Root Cause Analysis

### What Was Happening

1. User registers with display name "ABC Company"
2. Registration API correctly saves metadata: `{ display_name: "ABC Company", first_name: "John", last_name: "Doe" }`
3. Database trigger runs but only looks for `name` and `full_name`
4. Trigger falls back to email or "User"
5. Profile created with wrong name

### What Happens Now

1. User registers with display name "ABC Company"
2. Registration API saves metadata correctly ✅
3. **Enhanced trigger** looks for `display_name` first ✅
4. Profile created with "ABC Company" ✅

## Status

- ✅ **Database trigger fixed** - Now prioritizes display_name
- ✅ **Auth utils updated** - Better name resolution logic
- ✅ **Existing profiles updated** - SQL script fixes old profiles
- ✅ **API endpoint available** - For manual fixes if needed

New registrations will now correctly use the display name from the registration form! 🎉
