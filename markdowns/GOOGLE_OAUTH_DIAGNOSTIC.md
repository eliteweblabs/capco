# Google OAuth Verification Error - Diagnostic Guide

## The Error

> "qudlxlryegnainztkrtk.supabase.co has not completed the Google verification process. The app is currently being tested, and can only be accessed by developer-approved testers."

## What This Actually Means

The error mentions **`qudlxlryegnainztkrtk.supabase.co`** - this is your **Supabase project URL**. This means the OAuth app configured in **Supabase Dashboard** is in testing mode.

## Why This Happened (If Nothing Changed)

Even if you didn't change anything, Google can automatically move apps to testing mode if:

1. **Google's automated review flagged it** - They periodically review apps with sensitive scopes
2. **OAuth app was reset/recreated** - Someone may have accidentally recreated credentials
3. **Google policy enforcement** - Stricter enforcement of verification requirements (happened in 2024/2025)
4. **Supabase changed something** - Supabase may have updated their OAuth configuration

## Quick Diagnostic Steps

### Step 1: Check Which OAuth App Is Affected

You have **two potential OAuth apps**:

1. **Supabase OAuth App** (for user authentication via Supabase)
   - Configured in: Supabase Dashboard → Authentication → Providers → Google
   - Used by: `supabase.auth.signInWithOAuth()` calls
   - **This is likely the one causing the issue**

2. **Direct Google OAuth App** (for Gmail/Contacts features)
   - Configured in: Environment variables (`GOOGLE_PEOPLE_CLIENT_ID`)
   - Used by: `/api/google/signin` endpoint
   - Separate OAuth app

### Step 2: Check Supabase OAuth Configuration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Providers** → **Google**
4. Note the **Client ID** shown there
5. Check if it says "Enabled" or if there are any warnings

### Step 3: Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Check the **Publishing status**:
   - **Testing** = Only test users can access (this is your problem)
   - **In production** = Everyone can access

### Step 4: Find the OAuth Client ID

1. In Google Cloud Console, go to **APIs & Services** → **Credentials**
2. Find the OAuth 2.0 Client ID that matches the one in Supabase Dashboard
3. Click on it to see details
4. Check the **Authorized redirect URIs** - should include:
   - `https://qudlxlryegnainztkrtk.supabase.co/auth/v1/callback`

## Most Likely Scenarios

### Scenario A: Google Automated Review (Most Likely)

**What happened:**
- Google's automated system reviewed your OAuth app
- Detected sensitive scopes (`gmail.readonly`, `contacts.readonly`)
- Moved app to testing mode automatically
- You may have received an email notification (check spam)

**Fix:**
1. Go to Google Cloud Console → OAuth consent screen
2. Add test users (immediate fix)
3. Or submit for verification (permanent fix)

### Scenario B: OAuth App Was Recreated

**What happened:**
- Someone recreated the OAuth credentials in Google Cloud Console
- New OAuth apps start in testing mode by default
- Old credentials were deleted/replaced

**How to check:**
- Look at OAuth app creation date in Google Cloud Console
- Check if it's recent (last few days/weeks)

**Fix:**
- If recreated, you need to either:
  1. Add test users
  2. Publish the app (if no sensitive scopes)
  3. Submit for verification (if sensitive scopes)

### Scenario C: Supabase Changed OAuth Configuration

**What happened:**
- Supabase may have updated their OAuth setup
- Changed the Client ID/Secret
- New credentials = new OAuth app = testing mode

**How to check:**
- Compare the Client ID in Supabase Dashboard with what's in Google Cloud Console
- Check if they match

**Fix:**
- If Supabase changed it, you may need to:
  1. Update Google Cloud Console with new credentials
  2. Add test users to new OAuth app
  3. Contact Supabase support if this was unexpected

## Immediate Fix (5 Minutes)

### Add Test Users

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **OAuth consent screen**
3. Scroll to **Test users** section
4. Click **+ ADD USERS**
5. Add email addresses of users who need access:
   - Your email
   - Admin emails
   - Any client emails that need access
6. Click **ADD**
7. Wait 1-2 minutes for changes to propagate
8. Try Google OAuth sign-in again

**Note:** Maximum 100 test users allowed in testing mode.

## Check for Google Notifications

Google usually sends email notifications when they change app status:

1. Check your email (including spam) for messages from:
   - `noreply@google.com`
   - `google-cloud-platform-noreply@google.com`
2. Look for subject lines like:
   - "Action required: OAuth consent screen"
   - "Your OAuth app requires verification"
   - "Changes to your Google Cloud project"

## Verify What Actually Changed

### Check OAuth App History

1. Go to Google Cloud Console
2. **APIs & Services** → **OAuth consent screen**
3. Look for any recent changes or warnings
4. Check the **App domain** and **Authorized domains** sections

### Check Supabase Dashboard

1. Go to Supabase Dashboard
2. **Authentication** → **Providers** → **Google**
3. Check for any warnings or error messages
4. Verify the Client ID hasn't changed

## Permanent Solutions

### Option 1: Remove Sensitive Scopes (If Not Needed)

If you don't actually need Gmail/Contacts access for basic authentication:

1. Remove `gmail.readonly` and `contacts.readonly` from OAuth requests
2. Keep only: `openid email profile`
3. Publish the OAuth app (no verification needed for basic scopes)

### Option 2: Complete Google Verification (If You Need Scopes)

If you need Gmail/Contacts access:

1. Complete OAuth consent screen
2. Add privacy policy and terms of service
3. Submit for Google verification
4. Wait 1-2 weeks for approval

## Next Steps

1. **Immediate:** Add test users to restore access
2. **Check:** Look for Google email notifications
3. **Verify:** Check if OAuth app was recreated
4. **Decide:** Remove scopes or complete verification

## Questions to Answer

- [ ] Did you receive any emails from Google recently?
- [ ] When did this start happening? (exact date/time)
- [ ] Did anyone access Google Cloud Console recently?
- [ ] Did Supabase Client ID change?
- [ ] Do you actually need Gmail/Contacts scopes for basic auth?








