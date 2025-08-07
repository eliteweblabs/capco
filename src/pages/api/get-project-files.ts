import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("get-project-files API called");
    const { projectId } = await request.json();
    console.log("Project ID:", projectId);

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!supabase) {
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("User auth result:", { user: !!user, error: userError });

    if (userError || !user) {
      console.log("No authenticated user, returning demo response");
      // Return empty files array for demo purposes when not authenticated
      return new Response(
        JSON.stringify({
          files: [],
          count: 0,
          message: "No files available (demo mode - sign in for real files)",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let userRole = "Client"; // Default role
    if (!profileError && profile) {
      userRole = profile.role || "Client";
    } else if (profileError) {
      console.error("Error fetching user profile:", profileError);
      // Keep default role
    }

    // Fetch files for the project
    let query = supabase
      .from("files")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "active")
      .order("uploaded_at", { ascending: false });

    // Apply RLS - Admins can see all files, Clients can only see files for their own projects
    if (userRole !== "Admin") {
      // For clients, we need to ensure they can only access files for their own projects
      // The RLS policy should handle this, but we'll add an extra check
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("author_id")
        .eq("id", projectId)
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

    const { data: files, error } = await query;

    console.log("Files fetch result:", {
      filesCount: files?.length || 0,
      error,
    });

    if (error) {
      console.error("Error fetching project files:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch project files",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Generate public URLs for files
    const filesWithUrls =
      files?.map((file) => {
        try {
          const { data } = supabase.storage
            .from("project-documents")
            .getPublicUrl(file.file_path);

          return {
            ...file,
            public_url: data.publicUrl,
          };
        } catch (error) {
          console.error(
            `Error generating URL for file ${file.file_name}:`,
            error,
          );
          return {
            ...file,
            public_url: null,
          };
        }
      }) || [];

    return new Response(
      JSON.stringify({
        files: filesWithUrls,
        count: filesWithUrls.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in get-project-files API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
