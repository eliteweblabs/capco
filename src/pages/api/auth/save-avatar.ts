import type { APIRoute } from "astro";
import { supabaseAdmin } from "../../../lib/supabase-admin";

/**
 * Download Google avatar and save to Supabase Storage
 * This prevents rate limiting from Google's CDN
 * 
 * Can be called directly (saveAvatarDirect) or via HTTP POST
 */
export async function saveAvatarDirect(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    if (!userId || !avatarUrl) {
      return { success: false, error: "User ID and avatar URL are required" };
    }

    console.log("📸 [SAVE-AVATAR] Processing avatar for user:", userId);

    // Skip if not a Google avatar URL (to avoid unnecessary downloads)
    if (!avatarUrl.includes("googleusercontent.com")) {
      console.log("📸 [SAVE-AVATAR] Not a Google avatar, skipping download");
      return { success: true, avatarUrl: avatarUrl };
    }

    // Download the avatar from Google
    console.log("📸 [SAVE-AVATAR] Downloading avatar from Google");
    const avatarResponse = await fetch(avatarUrl);

    if (!avatarResponse.ok) {
      console.error("📸 [SAVE-AVATAR] Failed to download avatar:", avatarResponse.status);
      return {
        success: false,
        error: `Failed to download avatar from Google: ${avatarResponse.status}`,
      };
    }

    const avatarBlob = await avatarResponse.blob();
    const avatarBuffer = Buffer.from(await avatarBlob.arrayBuffer());

    // Determine file extension from content type
    const contentType = avatarResponse.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    const fileName = `avatars/${userId}.${extension}`;

    console.log("📸 [SAVE-AVATAR] Uploading to Supabase Storage:", fileName);

    // Upload to Supabase Storage
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not configured");
    }

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("project-media") // Use existing project-media bucket
      .upload(fileName, avatarBuffer, {
        contentType: contentType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error("📸 [SAVE-AVATAR] Upload error:", uploadError);
      return {
        success: false,
        error: `Failed to upload avatar to storage: ${uploadError.message}`,
      };
    }

    // Get public URL for the avatar
    const { data: urlData } = supabaseAdmin.storage.from("project-media").getPublicUrl(fileName);

    const newAvatarUrl = urlData.publicUrl;
    console.log("📸 [SAVE-AVATAR] Avatar uploaded successfully:", newAvatarUrl);

    // Update profile with new avatar URL
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ avatarUrl: newAvatarUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("📸 [SAVE-AVATAR] Profile update error:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update profile with new avatar URL",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ [SAVE-AVATAR] Avatar saved successfully for user:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        avatarUrl: newAvatarUrl,
        message: "Avatar downloaded and saved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [SAVE-AVATAR] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
