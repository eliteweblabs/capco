# 🔐 Supabase Google OAuth Setup Guide

The issue you identified is correct - Google OAuth needs to be configured to **create new users automatically**, not just sign in existing ones.

## 🛠️ Required Supabase Configuration

### 1. Check Google OAuth Provider Settings

In your **Supabase Dashboard** → **Authentication** → **Providers** → **Google**:

✅ **Enable Google provider**
✅ **Set Authorized Client ID and Client Secret**
✅ **Configure Redirect URLs:**

- Development: `http://localhost:4321/api/auth/callback`
- Production: `https://RAILWAY_PUBLIC_DOMAIN/api/auth/callback`

### 2. Enable User Auto-Creation

In **Authentication** → **Settings**:

✅ **Enable "Allow new users to sign up"** (this is critical!)
✅ **Set "Confirm email" to OFF** (for easier testing, can enable later)
✅ **Enable "Use secure email change"** (recommended)

### 3. Database Trigger for Profile Creation

The trigger in `fix-database-setup.sql` should automatically create profiles, but if it's not working, there might be a permission issue.

## 🔍 Debugging Steps

### Step 1: Test Current Config

1. Visit `http://localhost:4321/debug`
2. Click "Debug Current Auth State"
3. Check if Supabase is properly configured

### Step 2: Test Google OAuth

1. Clear auth state: `http://localhost:4321/api/reset-auth`
2. Try Google OAuth sign-in from main page
3. Check browser developer console for errors
4. Check terminal for server logs

### Step 3: Manual Profile Creation

If OAuth works but no profile is created:

1. Go to `/debug` page
2. Click "Create Profile Manually"
3. This will create the missing profile

## 🚨 Common Issues & Solutions

### Issue: "Allow new users to sign up" is disabled

**Solution:** Enable it in Supabase Dashboard → Authentication → Settings

### Issue: Wrong callback URL

**Solution:** Update Google OAuth config to use port 4321 (default Astro port)

### Issue: Database trigger not working

**Solution:** Run the minimal SQL script and use manual profile creation

### Issue: RLS policies too restrictive

**Solution:** The minimal SQL script has simpler, more permissive policies

## 🧪 Testing Checklist

- [ ] Google OAuth provider enabled in Supabase
- [ ] "Allow new users to sign up" enabled
- [ ] Correct callback URLs configured
- [ ] Profiles table exists with proper RLS policies
- [ ] Test with fresh Google account
- [ ] Check browser console for errors
- [ ] Check server terminal for logs

## 💡 Pro Tips

1. **Use a fresh Google account** for testing to avoid cached OAuth states
2. **Check both browser console AND terminal** for complete error info
3. **Test in incognito mode** to avoid browser caching issues
4. **Verify the callback URL port** matches your dev server (4321)

## 🔧 Quick Fix Summary

The main changes made:

1. ✅ Fixed callback URL port (4322 → 4321)
2. ✅ Added Google OAuth query params for better consent flow
3. ✅ Created debug tools for troubleshooting
4. ✅ Provided manual profile creation fallback

Try Google OAuth again after checking these Supabase settings!
