/**
 * AI Agent Image Upload API
 *
 * Simple endpoint for uploading images from AI chat
 * POST /api/agent/upload-image
 */

import type { APIRoute } from "astro";
import { checkAuth } from "../../../lib/auth";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { isAuth, currentUser } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") || "ai-chat";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "File must be an image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "File size must be less than 10MB" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`;
    const filePath = `${folder}/${currentUser.id}/${fileName}`;

    console.log(`📸 [AI-IMAGE-UPLOAD] Uploading image: ${file.name} to ${filePath}`);

    // Upload to Supabase Storage (using dedicated ai-chat-images bucket)
    // This bucket should be configured as public in Supabase dashboard
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("ai-chat-images")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false, // Don't overwrite
      });

    if (uploadError) {
      console.error("❌ [AI-IMAGE-UPLOAD] Upload error:", uploadError);

      // If bucket doesn't exist, provide helpful error message
      if (
        uploadError.message?.includes("Bucket not found") ||
        (uploadError as any).statusCode === 404
      ) {
        return new Response(
          JSON.stringify({
            error: "Storage bucket not configured",
            details:
              "The 'ai-chat-images' bucket does not exist. Please create it in Supabase Storage and set it to public.",
            hint: "Go to Supabase Dashboard > Storage > Create Bucket > Name: 'ai-chat-images' > Public: Yes",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to upload image",
          details: uploadError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage.from("ai-chat-images").getPublicUrl(filePath);

    console.log(`✅ [AI-IMAGE-UPLOAD] Image uploaded successfully: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl,
        publicUrl: urlData.publicUrl,
        path: filePath,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [AI-IMAGE-UPLOAD] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to upload image",
        message: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
