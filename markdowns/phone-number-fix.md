# Phone Number Registration Fix

## Issue
After registering with a phone number in `MultiStepRegisterForm.astro`, the phone number was not showing on the profile page.

## Root Cause
**Data Location Mismatch:**
- Registration API (`/api/auth/register.ts`) saves phone to **`profiles` table** (line 151)
- Profile page was reading from **`user_metadata`** instead of **`profiles`**

## Solution
Updated `profile.astro` to read phone data from the correct location:

### Changes Made:

1. **Phone Value** (line 192):
   - ❌ **Before:** `value={currentUser?.user_metadata?.phone || ""}`
   - ✅ **After:** `value={userProfile?.phone || ""}`

2. **SMS Alerts** (line 195):
   - ❌ **Before:** `smsChecked={currentUser?.user_metadata?.smsAlerts || false}`
   - ✅ **After:** `smsChecked={userProfile?.smsAlerts || false}`

3. **Mobile Carrier** (line 39):
   - ❌ **Before:** `const storedCarrierKey = currentUser?.user_metadata?.mobileCarrier`
   - ✅ **After:** `const storedCarrierKey = userProfile?.mobileCarrier`

## Data Flow Convention

### Correct Convention (as seen in both APIs):

**Registration (`/api/auth/register.ts`):**
```typescript
const profilePayload: any = {
  id: authData.user.id,
  phone: registerData.phone?.trim() || null,
  // ... saved to profiles table
};
```

**Profile Update (`/api/users/update.ts`):**
```typescript
const updatePayload: any = {
  phone: phone?.trim() || null,
  // ... saved to profiles table
};
```

**Profile Display (`profile.astro`):**
```astro
const userProfile = currentUser?.profile || null;

<PhoneAndSMS
  value={userProfile?.phone || ""}
  smsChecked={userProfile?.smsAlerts || false}
/>
```

## Key Takeaway
Always use `userProfile` (which comes from the `profiles` table) for user profile data, NOT `user_metadata`. The `user_metadata` is for Supabase auth metadata, while `profiles` table is for our custom profile data.

## Date
January 27, 2026
