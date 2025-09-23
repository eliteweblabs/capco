import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  // console.log("📡 [API] POST /api/update-file-metadata called");

  try {
    if (!supabase) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Database not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authentication required",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { fileId, title, comments } = await request.json();

    if (!fileId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the file to verify ownership
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("id, project_id, author_id")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "File not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user is admin or file owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "Client";
    const isAdmin = userRole === "Admin" || userRole === "Staff";
    const isOwner = file.author_id === user.id;

    if (!isAdmin && !isOwner) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the file metadata
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateData.title = title || null;
    }

    if (comments !== undefined) {
      updateData.comments = comments || null;
    }

    const { error: updateError } = await supabase.from("files").update(updateData).eq("id", fileId);

    if (updateError) {
      console.error("Error updating file metadata:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // console.log("📡 [API] File metadata updated successfully for file:", fileId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "File metadata updated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Update file metadata error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to update file metadata",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
