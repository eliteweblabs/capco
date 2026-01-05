# Google OAuth Verification Error Fix

## Problem

You're seeing this error:
> "qudlxlryegnainztkrtk.supabase.co has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers."

## What Happened?

**This is a Google policy change, not a Supabase issue.**

Google has been tightening OAuth security policies. Your app requests sensitive scopes:
- `gmail.readonly` - Access to Gmail
- `contacts.readonly` - Access to Google Contacts

When Google detects these sensitive scopes without proper verification, they automatically move the OAuth app to **"Testing" mode**, which restricts access to:
- Only developer-approved test users
- Maximum 100 test users
- No public access

## Why This Happened Now

Possible reasons:
1. **Google automatically moved your app to testing mode** after detecting sensitive scopes
2. **OAuth app was reset/recreated** (lost published status)
3. **Google policy enforcement** - stricter verification requirements for sensitive scopes
4. **App was never published** - was always in testing mode

## Quick Fix: Add Test Users (Temporary)

If you need immediate access while working on verification:

### Step 1: Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**

### Step 2: Add Test Users

1. Scroll down to **Test users** section
2. Click **+ ADD USERS**
3. Add email addresses of users who need access:
   - Your email
   - Admin emails
   - Client emails (if needed)
4. Click **ADD**

**Note:** Maximum 100 test users allowed in testing mode.

### Step 3: Test Again

1. Clear browser cache/cookies
2. Try Google OAuth sign-in again
3. Test users should now be able to sign in

## Permanent Fix: Publish Your OAuth App

To allow public access (or more than 100 users), you need to publish your app:

### Option A: Remove Sensitive Scopes (Easiest)

If you don't actually need Gmail/Contacts access:

1. **Update your code** to remove sensitive scopes:
   - Remove `gmail.readonly` from OAuth requests
   - Remove `contacts.readonly` from OAuth requests
   - Keep only: `openid email profile`

2. **Update Supabase OAuth config**:
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Check if scopes are configured there

3. **Update Google Cloud Console**:
   - Go to OAuth consent screen
   - Remove sensitive scopes from the app
   - Publish the app (should work without verification for basic scopes)

### Option B: Complete Google Verification (Required for Sensitive Scopes)

If you need Gmail/Contacts access, you must verify your app:

#### Step 1: Prepare Your App for Verification

1. **Complete OAuth Consent Screen**:
   - App name, logo, support email
   - Privacy policy URL (required)
   - Terms of service URL (required)
   - Authorized domains

2. **Privacy Policy & Terms**:
   - Must be publicly accessible
   - Must explain how you use Gmail/Contacts data
   - Must comply with Google's requirements

#### Step 2: Submit for Verification

1. Go to **OAuth consent screen**
2. Click **PUBLISH APP** button
3. If sensitive scopes are detected, you'll see a verification prompt
4. Click **Submit for verification**
5. Fill out the verification form:
   - Explain why you need Gmail/Contacts access
   - Describe your app's functionality
   - Provide demo video/screenshots
   - Answer security questions

#### Step 3: Wait for Google Review

- Review can take **1-2 weeks** (sometimes longer)
- Google may ask for additional information
- You'll receive email updates on status

#### Step 4: After Approval

- App will be published
- All users can sign in (no test user limit)
- Sensitive scopes will work

## Which OAuth App to Update?

You have **two OAuth apps** potentially:

1. **Supabase OAuth App** (for Supabase auth):
   - Configured in Supabase Dashboard
   - Used by `supabase.auth.signInWithOAuth()`
   - This is likely the one causing the issue

2. **Direct Google OAuth App** (for Gmail/Contacts):
   - Configured in your code (`GOOGLE_PEOPLE_CLIENT_ID`)
   - Used by `/api/google/signin`
   - Separate from Supabase

**Check both** in Google Cloud Console to see which one is in testing mode.

## Finding Your OAuth Apps

### Find Supabase OAuth App

1. Go to Supabase Dashboard → Authentication → Providers → Google
2. Note the **Client ID** shown there
3. Go to Google Cloud Console → Credentials
4. Find the OAuth 2.0 Client ID matching that Client ID
5. Check its status in OAuth consent screen

### Find Direct Google OAuth App

1. Check your environment variables for `GOOGLE_PEOPLE_CLIENT_ID`
2. Go to Google Cloud Console → Credentials
3. Find the OAuth 2.0 Client ID matching that Client ID
4. Check its status

## Recommended Approach

**For immediate access:**
1. Add test users to the OAuth app (quick fix)
2. Continue using the app while working on verification

**For long-term:**
1. Decide if you actually need Gmail/Contacts scopes
2. If yes → Complete Google verification
3. If no → Remove sensitive scopes and publish app

## Verification Checklist

- [ ] Identified which OAuth app is in testing mode
- [ ] Added test users (temporary fix)
- [ ] Decided: Keep or remove sensitive scopes?
- [ ] If keeping: Privacy policy and terms created
- [ ] If keeping: OAuth consent screen completed
- [ ] If keeping: Submitted for Google verification
- [ ] If removing: Updated code to remove scopes
- [ ] If removing: Published app in Google Cloud Console

## Common Questions

**Q: Can I use the app while waiting for verification?**
A: Yes, add test users (up to 100) to continue using it.

**Q: How long does verification take?**
A: Typically 1-2 weeks, sometimes longer for sensitive scopes.

**Q: What if I don't need Gmail/Contacts?**
A: Remove those scopes from your OAuth requests and publish the app - no verification needed.

**Q: Can I have both Supabase OAuth and direct Google OAuth?**
A: Yes, but you need to manage both OAuth apps separately in Google Cloud Console.

**Q: Will this affect existing users?**
A: Existing authenticated users should be fine. New sign-ins will be blocked until test users are added or app is published.








