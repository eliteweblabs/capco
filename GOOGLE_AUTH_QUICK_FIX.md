# Google OAuth - Quick Fix to Sign In NOW

## Problem
Your Google OAuth app is in "Testing" mode and only allows approved test users.

## Solution: Add Yourself as Test User (Takes 2 minutes)

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project (the one with client ID: `429196537235-lt29v8tho3viukrm5fubrg34iegmd6jb`)

### Step 2: Add Test User
1. Go to: **APIs & Services** → **OAuth consent screen**
2. Scroll down to **Test users** section
3. Click **+ ADD USERS**
4. Add: `tom@tomsens.com`
5. Click **SAVE**

### Step 3: Try Again
1. Clear browser cache/cookies (or use incognito)
2. Try Google sign-in again
3. Should work immediately!

---

## Permanent Fix: Remove Sensitive Scopes & Publish

### Step 1: Update Scopes in Google Cloud Console
1. Go to **OAuth consent screen**
2. Click **EDIT APP**
3. Click **SAVE AND CONTINUE** through "App information"
4. On **Scopes** page:
   - Remove `gmail.readonly` scope
   - Remove `contacts.readonly` scope
   - Keep only: `openid`, `email`, `profile`
5. Click **SAVE AND CONTINUE**

### Step 2: Publish the App
1. Still on **OAuth consent screen** page
2. Look for **Publishing status** (should say "Testing")
3. Click **PUBLISH APP** button
4. Confirm publication

### Step 3: Wait
- Publishing can take a few minutes to propagate
- Once published, anyone can sign in (no test user limit)

---

## Why This Happened

The code I just updated removed Gmail scope from your **Astro app**, but the **Google Cloud Console** still has it configured. Both need to match.

After you update the Google Cloud Console to remove those scopes, you can publish the app and everyone can sign in.

---

## Need Gmail Access Later?

If you need Gmail features in the future:
1. Add the Gmail scope back to both code and Google Cloud Console
2. Submit your app for Google verification (takes 1-2 weeks)
3. Once verified, Gmail access will work for all users

