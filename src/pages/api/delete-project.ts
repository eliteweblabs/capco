import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    console.log("Delete project API called");

    // Check if Supabase is configured
    if (!supabase) {
      console.error("Database not configured - supabase client not available");
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Database not configured.",
        },
      });
    }

    // Get current user from cookies for authentication
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("Access token:", accessToken ? "Present" : "Missing");
    console.log("Refresh token:", refreshToken ? "Present" : "Missing");

    if (!accessToken || !refreshToken) {
      console.error("Not authenticated - missing tokens");
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Not authenticated. Please log in.",
        },
      });
    }

    // Set up session with regular supabase client
    console.log("Setting up session...");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Authentication failed. Please log in again.",
        },
      });
    }

    console.log("User authenticated:", user.id);

    // Get the request body
    const requestBody = await request.json();
    console.log("Request body:", requestBody);

    const { projectId } = requestBody;

    if (!projectId) {
      console.error("Project ID is required");
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Project ID is required.",
        },
      });
    }

    // Convert projectId to number if it's a string
    const projectIdNum = typeof projectId === "string" ? parseInt(projectId, 10) : projectId;

    if (isNaN(projectIdNum)) {
      console.error("Invalid project ID:", projectId);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Invalid project ID.",
        },
      });
    }

    console.log("Project ID:", projectIdNum);

    // Check if project exists and user has permission to delete it
    console.log("Looking up project:", projectIdNum);
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, author_id")
      .eq("id", projectIdNum)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Project not found.",
        },
      });
    }

    console.log("Project found:", project);

    // Check user's role and permissions
    console.log("Looking up user profile:", user.id);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
    }

    const isAdmin = profile?.role === "Admin";
    const isAuthor = project.author_id === user.id;

    console.log("User role:", profile?.role);
    console.log("Is admin:", isAdmin);
    console.log("Is author:", isAuthor);
    console.log("Project author:", project.author_id);
    console.log("Current user:", user.id);

    if (!isAdmin && !isAuthor) {
      console.error("Unauthorized to delete this project");
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/dashboard?error=Unauthorized to delete this project.",
        },
      });
    }

    // Delete associated files first (cascade delete)
    console.log("Deleting associated files...");
    const { error: filesError } = await supabase
      .from("files")
      .delete()
      .eq("project_id", projectIdNum);

    if (filesError) {
      console.error("Error deleting project files:", filesError);
    } else {
      console.log("Files deleted successfully");
    }

    // Delete the project
    console.log("Deleting project...");
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectIdNum);

    if (deleteError) {
      console.error("Failed to delete project:", deleteError);
      return new Response(
        JSON.stringify({
          error: `Failed to delete project: ${deleteError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Project deleted successfully");

    // Redirect to dashboard after successful deletion
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard",
        "Set-Cookie": "project_deleted=true; Path=/; Max-Age=10",
      },
    });
  } catch (error) {
    console.error("Error in delete-project API:", error);
    // Redirect to dashboard with error message
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/dashboard?error=Failed to delete project. Please try again.",
        "Set-Cookie": "project_delete_error=true; Path=/; Max-Age=10",
      },
    });
  }
};
