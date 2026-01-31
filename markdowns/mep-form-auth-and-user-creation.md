# MEP Form - Authentication & User Creation

## Overview

The MEP form handles both authenticated and non-authenticated users seamlessly:

- **Authenticated users**: Skip steps 1-3 (email, name, phone) and go straight to address
- **Non-authenticated users**: Fill out all steps, and a user account is created automatically

## How It Works

### 1. Form Configuration (`src/lib/forms/mep-form-config.ts`)

Steps 1-3 have `skipCondition: "isAuthenticated"`:

```typescript
{
  stepNumber: 1,
  title: "Your email?",
  skipCondition: "isAuthenticated", // Skip for logged-in users
  fields: [...]
}
```

### 2. Page Logic (`src/pages/mep-form.astro`)

Detects auth state and pre-fills user data:

```typescript
const user = Astro.locals.user;
const isAuthenticated = !!user;

const initialData = isAuthenticated
  ? {
      email: user.email,
      firstName: user.user_metadata?.firstName || "",
      lastName: user.user_metadata?.lastName || "",
      phone: user.user_metadata?.phone || "",
      isAuthenticated: true,
    }
  : {
      isAuthenticated: false,
    };
```

### 3. API Endpoint (`src/pages/api/mep/submit.ts`)

Handles both cases:

#### For Authenticated Users:
- Uses existing `user.id` from session
- Updates profile with any new data (phone, etc.)
- Creates project linked to their account

#### For Non-Authenticated Users:
1. **Checks if email exists** in `profiles` table
2. If exists:
   - Use existing user ID
   - Update profile with new data
3. If doesn't exist:
   - Create new auth user with temporary password
   - Create profile record
   - Mark source as "mep-form"
4. Create project linked to user account

## User Experience

### Authenticated Flow:
1. User clicks form → already logged in
2. Form shows "Logged in as user@email.com"
3. Form starts at Step 4 (Address)
4. Submits → Project created under their account

### Non-Authenticated Flow:
1. User clicks form → not logged in
2. Fills out email, name, phone (steps 1-3)
3. Fills out address (step 4)
4. Submits → Account created automatically
5. Project linked to new account
6. (Optional) User receives password reset email to claim account

## Database Operations

### Authenticated User:
```sql
-- Update profile (optional)
UPDATE profiles 
SET phone = $1, name = $2 
WHERE id = $userId;

-- Create project
INSERT INTO projects (authorId, address, title, status)
VALUES ($userId, $address, $title, 1);
```

### Non-Authenticated User (New):
```sql
-- Create auth user (via Supabase Auth Admin API)
-- Generates temporary password

-- Create profile
INSERT INTO profiles (id, email, name, phone, role)
VALUES ($newUserId, $email, $name, $phone, 'Client');

-- Create project
INSERT INTO projects (authorId, address, title, status)
VALUES ($newUserId, $address, $title, 1);
```

### Non-Authenticated User (Existing):
```sql
-- Find user
SELECT id FROM profiles WHERE email = $email;

-- Update profile
UPDATE profiles 
SET name = $1, phone = $2 
WHERE id = $existingUserId;

-- Create project
INSERT INTO projects (authorId, address, title, status)
VALUES ($existingUserId, $address, $title, 1);
```

## Security Considerations

1. **RLS Policies**: User can only view/edit their own projects via `author_id = auth.uid()`
2. **Temporary Passwords**: Generated passwords are cryptographically random
3. **Email Verification**: Currently skipped for smoother UX, can be enabled
4. **Service Role Key**: Used server-side only for creating users

## Future Enhancements

### Password Reset Email
Currently commented out in the API:

```typescript
// Send password reset email so they can set their own password
await supabase.auth.resetPasswordForEmail(userEmail, {
  redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
});
```

Enable this to allow users to claim their auto-created accounts.

### Email Notifications
- Send welcome email with project details
- Include link to claim account (password reset)
- Notify when project status changes

### Duplicate Detection
Currently checks by email only. Could enhance with:
- Phone number matching
- Name + address matching
- Fuzzy duplicate detection

## Testing

### Test Authenticated Flow:
1. Log in to the app
2. Visit `/mep-form`
3. Should see "Logged in as..." message
4. Form should start at Step 4 (Address)

### Test Non-Authenticated Flow (New User):
1. Log out or use incognito
2. Visit `/mep-form`
3. Fill out email (use new email not in system)
4. Fill out name, phone
5. Fill out address
6. Submit
7. Check database for new user and project

### Test Non-Authenticated Flow (Existing User):
1. Log out
2. Visit `/mep-form`
3. Use email of existing user
4. Fill out form
5. Submit
6. Check that project is linked to existing user ID

## Files

- **Config**: `src/lib/forms/mep-form-config.ts`
- **Page**: `src/pages/mep-form.astro`
- **API**: `src/pages/api/mep/submit.ts`
- **Docs**: This file

## Console Logs

The API endpoint logs extensively for debugging:

```
[MEP-SUBMIT] Received data: {...}
[MEP-SUBMIT] User authenticated: true/false
[MEP-SUBMIT] Using authenticated user: uuid, email
[MEP-SUBMIT] Found existing user: uuid
[MEP-SUBMIT] Creating new user account for: email
[MEP-SUBMIT] Created new user: uuid
[MEP-SUBMIT] Creating project: {...}
[MEP-SUBMIT] Project created: projectId
```

Check server logs to debug submission issues.
