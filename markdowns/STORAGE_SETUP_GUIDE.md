# 🪣 Supabase Storage Setup Guide

This guide will help you set up the required storage buckets for PDF uploads.

## 🎯 Required Storage Bucket

Your application needs a storage bucket named `project-documents` for file uploads.

## 📋 Step-by-Step Setup

### 1. Access Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Storage** in the left sidebar

### 2. Create Storage Bucket

1. Click **"New bucket"** button
2. Enter bucket name: `project-documents`
3. Set **Public bucket** to **OFF** (for security)
4. Click **"Create bucket"**

### 3. Configure Bucket Settings

1. Click on the `project-documents` bucket
2. Go to **Settings** tab
3. Ensure **Public bucket** is **OFF**
4. Set **File size limit** to **50MB** (or your preferred limit)
5. Set **Allowed MIME types** to include:
   - `application/pdf`
   - `image/*`
   - `video/*`
   - `audio/*`
   - `text/*`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `application/vnd.ms-excel`
   - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### 4. Run SQL Script

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `setup-storage-and-files.sql`
3. Click **"Run"** to execute the script

### 5. Verify Setup

1. Visit `/api/debug-storage` in your application
2. Check that all diagnostics pass
3. Try uploading a test file

## 🔧 Troubleshooting

### Issue: "Bucket not found" error

**Solution:**
- Ensure bucket name is exactly `project-documents` (case-sensitive)
- Check that bucket was created successfully in Storage dashboard

### Issue: "Permission denied" error

**Solution:**
- Run the SQL script to create storage policies
- Ensure user is authenticated
- Check RLS policies are properly configured

### Issue: "File type not allowed" error

**Solution:**
- Update bucket MIME type settings
- Check file type validation in upload API

### Issue: "Storage access error"

**Solution:**
- Verify Supabase environment variables are set
- Check that storage policies allow authenticated access
- Ensure user has proper role permissions

## 📊 Verification Commands

After setup, you can verify everything works:

```bash
# Check storage bucket exists
curl -X GET "https://your-project.supabase.co/storage/v1/bucket/project-documents" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Check files table exists
curl -X GET "https://your-project.supabase.co/rest/v1/files?select=*&limit=1" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 🚨 Important Notes

- **Bucket name must be exactly**: `project-documents`
- **Keep bucket private** for security
- **Run SQL script** to set up policies
- **Test with small files first**
- **Monitor storage usage** in Supabase dashboard

## 📞 Support

If you encounter issues:

1. Check the `/api/debug-storage` endpoint
2. Review Supabase logs in dashboard
3. Verify all environment variables are set
4. Test with a simple PDF file first
