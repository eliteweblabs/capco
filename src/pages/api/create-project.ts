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

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("📝 [CREATE-PROJECT] User not authenticated:", userError);
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
      });
    }

    console.log("📝 [CREATE-PROJECT] User authenticated:", {
      userId: user.id,
      userEmail: user.email,
    });

    // Get user profile to determine role
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
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
      projectAuthorId = user.id;
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

    // Prepare project data
    const projectData = {
      author_id: projectAuthorId,
      title: body.address || "New Project",
      address: body.address,
      description: body.description,
      sq_ft: body.sq_ft ? parseInt(body.sq_ft) : null,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      status: 10, // Default status for new projects (Specs Received)
    };

    console.log(
      "📝 [CREATE-PROJECT] Inserting project data:",
      JSON.stringify(projectData, null, 2)
    );

    // Create project
    const { data: projects, error } = await supabase
      .from("projects")
      .insert([projectData])
      .select();

    if (error) {
      console.error("📝 [CREATE-PROJECT] Database error:", error);
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

    // Log the project creation
    try {
      await SimpleProjectLogger.logProjectCreation(
        project.id,
        user.email || "unknown",
        projectData
      );
    } catch (logError) {
      console.error("Error logging project creation:", logError);
      // Don't fail the request if logging fails
    }

    console.log("📝 [CREATE-PROJECT] Project created successfully:", project.id);

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
