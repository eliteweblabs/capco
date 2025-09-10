import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../../lib/simple-logging";
import { supabase } from "../../../lib/supabase";

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  const projectId = params.id;

  try {
    const body = await request.json();
    // console.log("🔧 [UPDATE-PROJECT] Request body:", body);

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID required" }), {
        status: 400,
      });
    }

    // Normal Supabase logic (existing code)
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
      });
    }

    // Get user from session
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase!.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
      });
    }

    const userId = session.session.user.id;

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase!
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to verify user permissions" }), {
        status: 500,
      });
    }

    const userRole = profile?.role?.toLowerCase();

    // First, get the current project data for logging
    const { data: currentProject, error: fetchError } = await supabase!
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (fetchError || !currentProject) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
      });
    }

    // Check permissions for non-admin users
    if (userRole !== "admin" && currentProject.author_id !== userId) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
      });
    }

    // Prepare update data
    const updateData: any = {
      address: body.address?.replace(/, USA$/, "") || body.address,
      architect: body.architect && body.architect.trim() !== "" ? body.architect.trim() : null,
      sq_ft: body.sq_ft && body.sq_ft.trim() !== "" ? parseInt(body.sq_ft) : null,
      description: body.description,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      units: body.units && body.units.trim() !== "" ? parseInt(body.units) : null,
      building: body.building,
      project: body.project,
      service: body.service,
      requested_docs: body.requested_docs,
      assigned_to_id: body.assigned_to_id || null,
      updated_at: new Date().toISOString(),
    };

    // Add status if provided
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // console.log("🔧 [UPDATE-PROJECT] Building update query for project:", projectId);
    // console.log("🔧 [UPDATE-PROJECT] Update data:", updateData);
    // console.log("🔧 [UPDATE-PROJECT] User role:", userRole);

    let updateQuery = supabase!.from("projects").update(updateData).eq("id", projectId);

    // Only apply author_id filter for non-admin users
    if (userRole !== "admin") {
      updateQuery = updateQuery.eq("author_id", userId);
      // console.log("🔧 [UPDATE-PROJECT] Added author_id filter for non-admin user:", userId);
    }

    // console.log("🔧 [UPDATE-PROJECT] Executing database update...");
    const { data: projects, error } = await updateQuery.select();
    // console.log("🔧 [UPDATE-PROJECT] Database update completed:", {
      projects: projects?.length,
      error: error?.message,
    });

    if (error) {
      console.error("Error updating project:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Project not found or access denied" }), {
        status: 404,
      });
    }

    const project = projects[0];

    // Log the project update with granular logging
    try {
      const userEmail = session.session.user.email || "unknown";
      const newProjectData = { ...currentProject, ...updateData };

      // console.log(`📝 [API] Logging project update for project ${projectId} by ${userEmail}`);
      // console.log(`📝 [API] Status change: ${currentProject.status} -> ${newProjectData.status}`);

      await SimpleProjectLogger.logProjectChanges(
        parseInt(projectId),
        userEmail,
        currentProject,
        newProjectData
      );

      // console.log(`📝 [API] Project update logged successfully`);
    } catch (logError) {
      console.error("📝 [API] Error logging project update:", logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update project API error:", error);
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
