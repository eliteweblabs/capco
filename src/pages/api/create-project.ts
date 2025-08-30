import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  console.log("📝 [CREATE-PROJECT] API route called!");

  try {
    const body = await request.json();
    console.log("📝 [CREATE-PROJECT] Received request body:", JSON.stringify(body, null, 2));

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Get user from session using tokens
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    console.log("📝 [CREATE-PROJECT] Auth check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!accessToken || !refreshToken) {
      console.log("📝 [CREATE-PROJECT] Missing auth tokens");
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    // Set session
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError || !session.session?.user) {
      console.log("📝 [CREATE-PROJECT] Session error:", sessionError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
      });
    }

    const userId = session.session.user.id;
    console.log("📝 [CREATE-PROJECT] User authenticated:", {
      userId,
      userEmail: session.session.user.email,
    });

    // Get user profile to determine role
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.log("📝 [CREATE-PROJECT] Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to get user profile" }), {
        status: 500,
      });
    }

    console.log("📝 [CREATE-PROJECT] User profile:", userProfile);

    let projectAuthorId: string;

    // Determine project author based on user role
    if (userProfile.role === "Client") {
      // If current user is a client, they are the project author
      projectAuthorId = userId;
      console.log("📝 [CREATE-PROJECT] Client user - using their ID as author:", projectAuthorId);
    } else {
      // If current user is admin/staff, handle new client creation or existing client
      if (body.new_client === "on") {
        // Create new client profile
        const newClientData = {
          name: `${body.first_name} ${body.last_name}`.trim(),
          company_name: body.company_name,
          email: body.email,
          role: "Client",
        };

        console.log("📝 [CREATE-PROJECT] Creating new client profile:", newClientData);

        const { data: newClient, error: clientError } = await supabase
          .from("profiles")
          .insert([newClientData])
          .select()
          .single();

        if (clientError) {
          console.error("📝 [CREATE-PROJECT] Error creating client profile:", clientError);
          return new Response(JSON.stringify({ error: "Failed to create client profile" }), {
            status: 500,
          });
        }

        projectAuthorId = newClient.id;
        console.log("📝 [CREATE-PROJECT] New client created, using ID as author:", projectAuthorId);
      } else {
        // Use existing client from form
        if (!body.author_id) {
          return new Response(
            JSON.stringify({ error: "Author ID is required for admin/staff users" }),
            {
              status: 400,
            }
          );
        }
        projectAuthorId = body.author_id;
        console.log(
          "📝 [CREATE-PROJECT] Admin/Staff user - using existing client ID:",
          projectAuthorId
        );
      }
    }

    // Debug all button group fields
    const buttonGroupFields = ["building", "project", "service", "requested_docs"];

    buttonGroupFields.forEach((fieldName) => {
      console.log(`📝 [CREATE-PROJECT] Debug ${fieldName} field:`, {
        value: body[fieldName],
        type: typeof body[fieldName],
        isArray: Array.isArray(body[fieldName]),
        stringified: Array.isArray(body[fieldName])
          ? JSON.stringify(body[fieldName])
          : body[fieldName],
      });
    });

    // Prepare project data - match the update-project API structure
    const projectData = {
      author_id: projectAuthorId,
      title: body.address || "New Project",
      address: body.address,
      description: body.description,
      architect: body.architect,
      sq_ft: body.sq_ft ? parseInt(body.sq_ft) : null,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      units: body.units,
      // Button group fields - pass through as-is (Supabase handles JSONB conversion)
      building: body.building,
      project: body.project,
      service: body.service,
      requested_docs: body.requested_docs,
      created_at: new Date().toISOString(), // Set creation timestamp
      updated_at: new Date().toISOString(), // Set initial update timestamp
    };

    console.log(
      "📝 [CREATE-PROJECT] Inserting project data:",
      JSON.stringify(projectData, null, 2)
    );

    // Create project
    console.log("📝 [CREATE-PROJECT] About to insert project into database");
    const { data: projects, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("📝 [CREATE-PROJECT] Database error:", error);
      console.error("📝 [CREATE-PROJECT] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500,
      });
    }

    const project = projects[0];

    console.log("📝 [CREATE-PROJECT] Project created successfully:", project.id);

    // Set initial status to 10 (Specs Received) and trigger email notifications
    try {
      console.log("📝 [CREATE-PROJECT] Setting initial status to 10 and sending notifications...");

      // Update project with initial status
      const { data: updatedProject, error: statusError } = await supabase
        .from("projects")
        .update({
          status: 10, // "Specs Received"
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .select()
        .single();

      if (statusError) {
        console.error("📝 [CREATE-PROJECT] Error setting initial status:", statusError);
      } else {
        console.log("📝 [CREATE-PROJECT] Initial status set successfully:", updatedProject.status);
      }

      // Trigger email notifications via update-status API
      try {
        console.log("📝 [CREATE-PROJECT] Triggering email notifications via update-status...");
        const statusResponse = await fetch(
          `${import.meta.env.SITE_URL || "http://localhost:4321"}/api/update-status`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: `sb-access-token=${cookies.get("sb-access-token")?.value}; sb-refresh-token=${cookies.get("sb-refresh-token")?.value}`,
            },
            body: JSON.stringify({
              projectId: project.id,
              newStatus: 10,
            }),
          }
        );

        if (statusResponse.ok) {
          console.log("📝 [CREATE-PROJECT] Email notifications triggered successfully");
        } else {
          console.error(
            "📝 [CREATE-PROJECT] Failed to trigger email notifications:",
            await statusResponse.text()
          );
        }
      } catch (emailError) {
        console.error("📝 [CREATE-PROJECT] Error triggering email notifications:", emailError);
      }
    } catch (statusUpdateError) {
      console.error("📝 [CREATE-PROJECT] Error in status update process:", statusUpdateError);
      // Don't fail the request if status update fails
    }

    // Log the project creation
    try {
      await SimpleProjectLogger.logProjectCreation(
        project.id,
        session.session.user.email || "unknown",
        projectData
      );
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
    console.error("📝 [CREATE-PROJECT] Catch block error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

// Email notifications are now centralized in update-status.ts
// All status changes (including initial status 10) trigger emails via the status change system
