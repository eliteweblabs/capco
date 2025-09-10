import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("Delete media file API called");
    const { fileId } = await request.json();

    if (!fileId) {
      return new Response(JSON.stringify({ error: "File ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Set up session from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("📡 [API] Auth check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "Client";

    // Get file details first to check permissions and get file path
    const { data: file, error: fileError } = await supabase
      .from("files")
      .select("*, project_id")
      .eq("id", fileId)
      .single();

    if (fileError || !file) {
      console.error("File not found:", fileError);
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check permissions - Admin can delete any file, others can only delete files from their own projects
    if (userRole !== "Admin" && userRole !== "Staff") {
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("author_id")
        .eq("id", file.project_id)
        .single();

      if (projectError || !project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (project.author_id !== user.id) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Deleting file: ${file.file_name} (ID: ${fileId})`);

    // Delete from storage first
    if (file.file_path) {
      const { error: storageError } = await supabase.storage
        .from("project-documents")
        .remove([file.file_path]);

      if (storageError) {
        console.error("Error deleting from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
      } else {
        console.log("File deleted from storage successfully");
      }
    }

    // Delete from database
    const { error: dbError } = await supabase.from("files").delete().eq("id", fileId);

    if (dbError) {
      console.error("Error deleting from database:", dbError);
      return new Response(
        JSON.stringify({
          error: "Failed to delete file from database",
          details: dbError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("File deleted from database successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "File deleted successfully",
        fileId: fileId,
        fileName: file.file_name,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in delete media file API:", error);
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
