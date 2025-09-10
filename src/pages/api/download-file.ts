import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { filePath, fileName, projectId } = await request.json();

    // console.log("Download API called with:", { filePath, fileName, projectId });

    if (!filePath || !fileName || !projectId) {
      return new Response(
        JSON.stringify({ error: "File path, name, and project ID are required" }),
        {
          status: 400,
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
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify project access - check if user owns the project or is admin
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, author_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin or project owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const userRole = profile?.role || "Client";
    const isAdmin = userRole === "Admin" || userRole === "Staff";
    const isProjectOwner = project.author_id === user.id;

    if (!isAdmin && !isProjectOwner) {
      return new Response(JSON.stringify({ error: "Access denied to project files" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Download file from Supabase Storage
    // console.log("Attempting to download from storage:", filePath);

    // Extract the actual file path (remove bucket prefix if present)
    let actualFilePath = filePath;
    if (filePath.startsWith("project-documents/")) {
      actualFilePath = filePath.replace("project-documents/", "");
    }

    // console.log("Actual file path for download:", actualFilePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("project-documents")
      .download(actualFilePath);

    if (downloadError || !fileData) {
      console.error("Error downloading file from storage:", downloadError);
      console.error("File path attempted:", filePath);
      return new Response(
        JSON.stringify({
          error: "Failed to download file",
          details: downloadError?.message || "Unknown error",
          filePath: filePath,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();

    // Return file with proper headers for download
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Download API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
