import type { APIRoute } from "astro";
import { SimpleProjectLogger } from "../../lib/simple-logging";
import { supabase } from "../../lib/supabase";
import { getApiBaseUrl } from "../../lib/url-utils";

export const POST: APIRoute = async ({ request, cookies }) => {
  // console.log("📝 [CREATE-PROJECT] API route called!");

  try {
    const body = await request.json();
    // console.log("📝 [CREATE-PROJECT] Received request body:", JSON.stringify(body, null, 2));

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
      });
    }

    // Get user from session using tokens
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    // console.log("📝 [CREATE-PROJECT] Auth check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    if (!accessToken || !refreshToken) {
      // console.log("📝 [CREATE-PROJECT] Missing auth tokens");
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
      // console.log("📝 [CREATE-PROJECT] Session error:", sessionError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
      });
    }

    const userId = session.session.user.id;
    // console.log("📝 [CREATE-PROJECT] User authenticated:", {
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
      // console.log("📝 [CREATE-PROJECT] Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ error: "Failed to get user profile" }), {
        status: 500,
      });
    }

    // console.log("📝 [CREATE-PROJECT] User profile:", userProfile);

    let projectAuthorId: string;

    // Determine project author based on user role
    if (userProfile.role === "Client") {
      // If current user is a client, they are the project author
      projectAuthorId = userId;
      // console.log("📝 [CREATE-PROJECT] Client user - using their ID as author:", projectAuthorId);
    } else {
      // If current user is admin/staff, handle new client creation or existing client
      if (body.new_client === "on") {
        // Create new client using the existing create-user endpoint
        const { first_name, last_name, company_name, email } = body;

        if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
          return new Response(
            JSON.stringify({
              error: "First name, last name, and email are required for new clients",
              details: "Please fill in all required fields for the new client",
            }),
            { status: 400 }
          );
        }

        // console.log("📝 [CREATE-PROJECT] Creating new client using create-user endpoint");

        try {
          // Call the create-user API to create the new client
          const baseUrl = getApiBaseUrl(request);
          const createUserResponse = await fetch(`${baseUrl}/api/create-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: `sb-access-token=${cookies.get("sb-access-token")?.value}; sb-refresh-token=${cookies.get("sb-refresh-token")?.value}`,
            },
            body: JSON.stringify({
              first_name: first_name.trim(),
              last_name: last_name.trim(),
              company_name: company_name?.trim() || "",
              email: email.trim(),
              phone: "",
              role: "Client",
            }),
          });

          const createUserResult = await createUserResponse.json();

          if (!createUserResponse.ok || !createUserResult.success) {
            console.error("📝 [CREATE-PROJECT] Failed to create client:", createUserResult);
            return new Response(
              JSON.stringify({
                error: createUserResult.error || "Failed to create client",
                details: createUserResult.details || "Please try again",
              }),
              { status: createUserResponse.status }
            );
          }

          // Use the created user's ID as the project author
          projectAuthorId = createUserResult.user.id;
          // console.log("📝 [CREATE-PROJECT] New client created successfully, ID:", projectAuthorId);
        } catch (error) {
          console.error("📝 [CREATE-PROJECT] Error calling create-user endpoint:", error);
          return new Response(
            JSON.stringify({
              error: "Failed to create client",
              details: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
          );
        }
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
        // console.log(
          "📝 [CREATE-PROJECT] Admin/Staff user - using existing client ID:",
          projectAuthorId
        );
      }
    }

    // Debug all button group fields
    const buttonGroupFields = ["building", "project", "service", "requested_docs"];

    buttonGroupFields.forEach((fieldName) => {
      // console.log(`📝 [CREATE-PROJECT] Debug ${fieldName} field:`, {
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
      title: body.address || body.title,
      address: body.address?.replace(/, USA$/, "") || body.address,
      description: body.description,
      architect: body.architect && body.architect.trim() !== "" ? body.architect.trim() : null,
      sq_ft: body.sq_ft && body.sq_ft.trim() !== "" ? parseInt(body.sq_ft) : null,
      new_construction: body.new_construction === "on" || body.new_construction === true,
      units: body.units && body.units.trim() !== "" ? parseInt(body.units) : null,
      // Button group fields - all are now consistently arrays
      building: body.building || [],
      project: body.project || [],
      service: body.service || [],
      requested_docs: body.requested_docs || [],
      status: 0, // Set initial status to 0, will be updated to 10 via update-status API to trigger emails
      created_at: new Date().toISOString(), // Set creation timestamp
      updated_at: new Date().toISOString(), // Set initial update timestamp
    };

    // console.log(
      "📝 [CREATE-PROJECT] Inserting project data:",
      JSON.stringify(projectData, null, 2)
    );

    // SAFETY CHECK: Ensure project author is always a client
    // This prevents the issue where projects could be created with admin/staff authors
    // The check validates that the author_id corresponds to a user with role = 'Client'
    // console.log("📝 [CREATE-PROJECT] Safety check: Verifying project author role");
    const { data: authorProfile, error: authorCheckError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", projectAuthorId)
      .single();

    if (authorCheckError) {
      console.error(
        "📝 [CREATE-PROJECT] Safety check failed - could not verify author role:",
        authorCheckError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to verify project author role",
          details: "Could not validate that the project author is a client",
        }),
        {
          status: 500,
        }
      );
    }

    if (authorProfile.role !== "Client") {
      console.error("📝 [CREATE-PROJECT] SAFETY CHECK FAILED - Project author is not a client!", {
        authorId: projectAuthorId,
        authorRole: authorProfile.role,
        expectedRole: "Client",
        currentUserRole: userProfile.role,
      });
      return new Response(
        JSON.stringify({
          error: "Project author must be a client",
          details: `Cannot create project with author role: ${authorProfile.role}. Only clients can be project authors.`,
        }),
        {
          status: 400,
        }
      );
    }

    // console.log("📝 [CREATE-PROJECT] ✅ Safety check passed - project author is a client:", {
      authorId: projectAuthorId,
      authorRole: authorProfile.role,
    });

    // Create project
    // console.log("📝 [CREATE-PROJECT] About to insert project into database");
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
      console.error(
        "📝 [CREATE-PROJECT] Project data that failed:",
        JSON.stringify(projectData, null, 2)
      );
      return new Response(
        JSON.stringify({
          error: error.message,
          details: error.details,
          code: error.code,
          hint: error.hint,
        }),
        {
          status: 500,
        }
      );
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500,
      });
    }

    const project = projects[0];

    // console.log("📝 [CREATE-PROJECT] Project created successfully:", {
      id: project.id,
      author_id: project.author_id,
      title: project.title,
      address: project.address,
      status: project.status,
    });

    // Verify the project has the correct initial status
    if (project.status !== 0) {
      console.error("📝 [CREATE-PROJECT] WARNING: Project created without status 0!", {
        actualStatus: project.status,
        expectedStatus: 0,
        projectId: project.id,
      });
    } else {
      // console.log(
        "📝 [CREATE-PROJECT] ✅ Project created with correct initial status:",
        project.status
      );
    }

    // Note: Frontend should now call /api/update-status to set status from 0 -> 10
    // This will trigger proper email notifications for "Specs Received" status

    // console.log("📝 [CREATE-PROJECT] ==========================================");

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

    return new Response(
      JSON.stringify({
        success: true,
        project: project,
        message: "Project created successfully",
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("📝 [CREATE-PROJECT] Catch block error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
