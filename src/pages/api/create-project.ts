import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    console.log("📝 [CREATE-PROJECT] Received request body:", JSON.stringify(body, null, 2));

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

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Handle client data and determine who the project author should be
    let owner = body.owner;
    let projectAuthorId = userId; // Default to current user

    if (body.client_type === "new") {
      // For new client, use the provided owner name and current user as author
      owner = body.client_name;
      projectAuthorId = userId; // Current user becomes the project author
      // Note: You might want to create a new client profile here
      // For now, we'll just use the owner name
    } else if (body.client_type === "existing" && body.author_id) {
      // For existing client, use the selected client as the project author
      const { data: clientProfile } = await supabase!
        .from("profiles")
        .select("name")
        .eq("id", body.author_id)
        .single();

      if (clientProfile) {
        owner = clientProfile.name;
        projectAuthorId = body.author_id; // Selected client becomes the project author
      }
    }

    // Prepare project data
    const projectData = {
      author_id: projectAuthorId, // Set to the appropriate client/user
      address: body.address,
      owner: owner,
      architect: body.architect,
      sq_ft: body.sq_ft,
      description: body.description,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      units: body.units,
      building: body.building,
      project: body.project,
      service: body.service,
      requested_docs: body.requested_docs,
      status: 1, // Default status
    };

    console.log(
      "📝 [CREATE-PROJECT] Inserting project data:",
      JSON.stringify(projectData, null, 2)
    );

    // Note: No complex setup needed for simple logging

    // Create project
    const { data: projects, error } = await supabase!
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("Error creating project:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500,
      });
    }

    const project = projects[0]; // Get the first (and should be only) project

    // Log the project creation with simple logging
    try {
      const userEmail = session.session.user.email || "unknown";
      await SimpleProjectLogger.logProjectCreation(project.id, userEmail, projectData);
    } catch (logError) {
      console.error("Error logging project creation:", logError);
      // Don't fail the request if logging fails
    }

    return new Response(JSON.stringify(project), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in create-project:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
