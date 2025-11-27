# 🖼️ AI Chat Images Storage Bucket Setup

This guide explains how to set up the dedicated public storage bucket for AI chat images.

## 🎯 Purpose

The `ai-chat-images` bucket is a **public** storage bucket specifically for images uploaded in the AI chat interface. These images need to be publicly accessible so that Claude AI can analyze them.

**Why a separate bucket?**

- Security: Keeps AI chat images separate from private project files
- Public access: Claude AI needs to access images via URL
- Simpler permissions: No complex RLS needed for public images

## 📋 Setup Steps

### Option 1: Using SQL Migration (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `sql-queriers/create-ai-chat-images-bucket.sql`
4. Click **"Run"** to execute the script

This will:

- Create the `ai-chat-images` bucket
- Set it as public
- Configure 10MB file size limit
- Set allowed MIME types to image formats only
- Create RLS policies for authenticated uploads

### Option 2: Manual Setup via Dashboard

1. Go to **Storage** in Supabase Dashboard
2. Click **"New bucket"**
3. Configure:
   - **Name**: `ai-chat-images`
   - **Public bucket**: ✅ **ON** (required for Claude AI access)
   - **File size limit**: 10MB
   - **Allowed MIME types**:
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`
     - `image/svg+xml`
4. Click **"Create bucket"**

### 3. Verify Setup

After creating the bucket, test the image upload:

1. Go to `/ai-agent` page
2. Try dragging/dropping an image into the chat input
3. Check that the image uploads successfully
4. Verify the image URL is publicly accessible

## 🔒 Security Considerations

### Public Access

- ✅ **Public read access is required** - Claude AI needs to access images via URL
- ✅ **Only authenticated users can upload** - RLS policies prevent anonymous uploads
- ✅ **Users can only manage their own images** - Policies restrict updates/deletes to user's own folder

### File Organization

Images are stored in the following structure:

```
ai-chat-images/
  └── ai-chat/
      └── {user-id}/
          └── {timestamp}-{random}.{ext}
```

This ensures:

- Each user's images are in their own folder
- Easy cleanup if needed
- Clear organization

## 🐛 Troubleshooting

### Error: "Bucket not found"

**Solution**: Run the SQL migration script or create the bucket manually in Supabase Dashboard.

### Error: "Permission denied"

**Solution**:

- Verify the bucket is set to **Public**
- Check that RLS policies were created (run the SQL script)
- Ensure you're authenticated when uploading

### Claude AI can't access images

**Solution**:

- Verify bucket is **Public** (not private)
- Check that the image URL is publicly accessible (try opening in incognito browser)
- Ensure image URLs are being passed correctly to the API

### Images not uploading

**Solution**:

- Check file size (must be < 10MB)
- Verify file type is an image format
- Check browser console for error messages
- Verify Supabase Storage is accessible from your application

## 📝 Notes

- **File Size Limit**: 10MB per image (configurable in bucket settings)
- **Supported Formats**: JPEG, PNG, GIF, WebP, SVG
- **Storage Location**: Supabase Storage (same region as your project)
- **Retention**: Images persist until manually deleted or user account is deleted

## 🔗 Related Files

- `src/pages/api/agent/upload-image.ts` - Image upload endpoint
- `src/components/common/AIChatAgent.astro` - Frontend chat component
- `src/lib/ai/unified-agent.ts` - AI agent that processes images
- `sql-queriers/create-ai-chat-images-bucket.sql` - Database migration script
