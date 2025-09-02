# Revert to Supabase Authentication Emails

## 🎯 **Simple Switch Back**

You're right - this should just be a simple switch back to how it was working before the Supabase outage!

---

## 📋 **Step 1: Supabase Dashboard (5 minutes)**

1. **Go to your Supabase project dashboard**
2. **Navigate to Authentication → Settings**
3. **Email Settings Section - RE-ENABLE these:**
   - ✅ **Enable "Enable email confirmations"**
   - ✅ **Enable "Enable email change confirmations"**
   - ✅ **Enable "Enable password recovery emails"**

That's it for the dashboard! Supabase will now handle all auth emails automatically.

---

## 🔧 **Step 2: Remove Custom Email Code (Optional)**

The registration API currently sends custom welcome emails via Resend. Since Supabase will now send confirmation emails automatically, you can either:

### **Option A: Keep Both (Recommended for now)**

- Let Supabase send confirmation emails
- Keep the custom welcome emails for additional user experience
- No code changes needed

### **Option B: Remove Custom Emails**

- Remove the custom email sending code from registration
- Only use Supabase's built-in emails
- Cleaner, simpler code

---

## ✅ **What Happens Now**

### **Registration Flow:**

1. User submits registration form
2. Supabase creates user account
3. **Supabase automatically sends confirmation email** 📧
4. User clicks confirmation link
5. User can sign in

### **Password Reset Flow:**

1. User clicks "Forgot Password"
2. **Supabase automatically sends reset email** 📧
3. User follows reset link

---

## 🚀 **Test It**

1. **Try registering a new user**
2. **Check email for Supabase confirmation email** (not Resend)
3. **Click confirmation link**
4. **Verify you can sign in**

---

## 📝 **Environment Variables**

You can keep your current `.env` settings:

```bash
# Keep Resend for other emails (project notifications, etc.)
EMAIL_PROVIDER=resend
EMAIL_API_KEY=re_your_api_key_here
FROM_EMAIL=noreply@capcofire.com
FROM_NAME=CAPCo Fire Protection

# Remove this line (or comment it out):
# SUPABASE_AUTH_EMAIL_DISABLED=true
```

---

## 🎯 **Benefits of Switching Back**

- ✅ **Simpler**: No custom email code to maintain
- ✅ **Reliable**: Supabase handles all the auth security
- ✅ **Cost-effective**: No Resend usage for auth emails
- ✅ **Built-in**: Confirmation tokens, security, etc. all handled
- ✅ **Less code**: Fewer moving parts to debug

---

## 🔄 **If You Want to Clean Up Later**

Once you confirm everything works, you can optionally:

1. Remove custom auth email code from registration
2. Delete `src/lib/auth-email-service.ts` (if only used for auth)
3. Keep Resend for project notifications and other business emails

---

**This should get you back to the working state you had before the outage! The main thing is just re-enabling those email settings in the Supabase dashboard.** 🚀
