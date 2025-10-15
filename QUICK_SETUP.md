# 🚀 **Quick Setup Guide - Vapi.ai Appointment System**

## **✅ Current Status:**

- ✅ **System logic working** - Conversational responses ready
- ✅ **API endpoints created** - All appointment functions ready
- ⏳ **Need Supabase credentials** - Add to .env file
- ⏳ **Need database schema** - Run in Supabase
- ⏳ **Need Vapi.ai API key** - Get from dashboard

---

## **Step 1: Add Supabase Credentials to .env**

### **Get Your Supabase Credentials:**

1. Go to your **Supabase Dashboard**
2. Navigate to **Settings > API**
3. Copy these values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### **Add to Your .env File:**

```bash
# Supabase Database Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Vapi.ai Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_WEBHOOK_SECRET=O2LCSbvXfUo3OXTsUKalUSrQOrtEZAA4lfBdxvxExm8=

# Site Configuration
SITE_URL=http://localhost:4321
```

---

## **Step 2: Run Database Schema**

### **Copy This SQL to Supabase:**

1. Go to your **Supabase Dashboard > SQL Editor**
2. Copy and paste the contents of `sql-queriers/minimal-appointments-schema.sql`
3. Click **Run**

---

## **Step 3: Test the System**

### **Test System Logic:**

```bash
curl -s http://localhost:4321/api/test-system | jq
```

**Expected:** ✅ System logic working

### **Test Database Connection:**

```bash
curl -s http://localhost:4321/api/test-appointments-simple | jq
```

**Expected:** ✅ Database connection working

---

## **Step 4: Get Vapi.ai API Key**

1. Go to [https://dashboard.vapi.ai/](https://dashboard.vapi.ai/)
2. Sign up/login
3. Get your API key
4. Add it to your `.env` file

---

## **Step 5: Configure Vapi.ai Assistant**

```bash
node scripts/vapi-assistant-config.js
```

---

## **Step 6: Test Voice Interactions**

Your assistant will handle conversations like:

- **User:** "I need to schedule an appointment"
- **Assistant:** "I'd be happy to help! What day works best for you?"
- **User:** "How about next Tuesday?"
- **Assistant:** "How's Tuesday the 14th? We have 2pm and 4pm available"

---

## **🎯 What You'll Have:**

1. **Voice-Powered Appointment Booking**
   - Natural conversation flow
   - Smart availability suggestions
   - Automatic scheduling

2. **Complete API System**
   - Appointment CRUD operations
   - Availability checking
   - User management

3. **Database Integration**
   - Minimal appointments schema
   - RLS security policies
   - Optimized queries

4. **Production Ready**
   - Error handling
   - Authentication
   - Scalable architecture

---

## **🔧 Troubleshooting**

### **"Supabase admin client not configured"**

- Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file
- Get it from Supabase Dashboard > Settings > API

### **"Appointments table not found"**

- Run the `minimal-appointments-schema.sql` in Supabase
- Check the SQL Editor for any errors

### **"Authentication required"**

- Make sure you're logged into your app
- Check session cookies are being passed

---

## **📞 Ready to Go!**

Once you add your Supabase credentials to `.env`, the system will be fully functional! 🎉
